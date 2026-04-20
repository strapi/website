import qs from "qs"

const SOURCE_URL = process.env["SOURCE_URL"]
const SOURCE_TOKEN = process.env["SOURCE_TOKEN"]

if (!SOURCE_URL || !SOURCE_TOKEN) {
  console.error("Missing SOURCE_URL or SOURCE_TOKEN in env")
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

interface V4Post {
  id: number
  attributes: {
    slug?: string
    title?: string
    publishedAt?: string | null
    slices?: { __component: string; id: number }[]
  }
}

interface V4Response {
  data: V4Post[]
  meta: { pagination: { page: number; pageCount: number; total: number } }
}

async function fetchPage(page: number, pageSize: number): Promise<V4Response> {
  const query = qs.stringify(
    {
      pagination: { page, pageSize },
      publicationState: "preview",
      locale: "en",
      fields: ["slug", "title", "publishedAt"],
      populate: { slices: { populate: [], fields: ["id"] } },
    },
    { encodeValuesOnly: true }
  )

  const url = `${SOURCE_URL}/api/blog-posts?${query}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SOURCE_TOKEN}` },
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${url}`)
  }

  return (await res.json()) as V4Response
}

interface Hit {
  slug: string
  title: string
  published: boolean
  hasRelatedBlogPosts: boolean
  hasRelatedPosts: boolean
}

async function main() {
  const pageSize = 100
  let page = 1
  let pageCount = 1
  const hits: Hit[] = []
  let scanned = 0

  while (page <= pageCount) {
    const res = await fetchPage(page, pageSize)
    pageCount = res.meta.pagination.pageCount
    scanned += res.data.length

    for (const post of res.data) {
      const slices = post.attributes.slices ?? []
      const components = new Set(slices.map((s) => s.__component))
      const hasRelatedBlogPosts = components.has("slices.related-blog-posts")
      const hasRelatedPosts = components.has("slices.related-posts")

      if (hasRelatedBlogPosts || hasRelatedPosts) {
        hits.push({
          slug: post.attributes.slug ?? String(post.id),
          title: post.attributes.title ?? "(no title)",
          published: Boolean(post.attributes.publishedAt),
          hasRelatedBlogPosts,
          hasRelatedPosts,
        })
      }
    }

    console.error(
      `page ${page}/${pageCount} — scanned ${scanned}/${res.meta.pagination.total}, hits ${hits.length}`
    )
    page++
  }

  const both = hits.filter((h) => h.hasRelatedBlogPosts && h.hasRelatedPosts)
  const onlyBlogPosts = hits.filter(
    (h) => h.hasRelatedBlogPosts && !h.hasRelatedPosts
  )
  const onlyPosts = hits.filter(
    (h) => !h.hasRelatedBlogPosts && h.hasRelatedPosts
  )

  console.log("\n=== Summary ===")
  console.log(`scanned:              ${scanned}`)
  console.log(`with related-blog-posts AND related-posts: ${both.length}`)
  console.log(
    `only related-blog-posts:                   ${onlyBlogPosts.length}`
  )
  console.log(`only related-posts:                        ${onlyPosts.length}`)

  const show = (label: string, arr: Hit[]) => {
    console.log(`\n--- ${label} (first 15) ---`)
    for (const h of arr.slice(0, 15)) {
      console.log(`  [${h.published ? "P" : "D"}] /${h.slug}  — ${h.title}`)
    }
  }

  show("BOTH", both)
  show("only related-blog-posts", onlyBlogPosts)
  show("only related-posts", onlyPosts)
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error(err)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})
