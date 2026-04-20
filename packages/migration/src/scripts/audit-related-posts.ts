/* eslint-disable unicorn/no-process-exit */
import qs from "qs"

const SOURCE_URL = process.env["SOURCE_URL"]
const SOURCE_TOKEN = process.env["SOURCE_TOKEN"]
if (!SOURCE_URL || !SOURCE_TOKEN) process.exit(1)

async function fetchPage(page: number) {
  const query = qs.stringify(
    {
      pagination: { page, pageSize: 50 },
      publicationState: "preview",
      locale: "en",
      fields: ["slug"],
      populate: {
        slices: {
          on: {
            "slices.related-posts": { populate: ["blogPosts", "category"] },
          },
        },
      },
    },
    { encodeValuesOnly: true }
  )
  const url = `${SOURCE_URL}/api/blog-posts?${query}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SOURCE_TOKEN}` },
  })
  if (!res.ok) throw new Error(`${res.status}`)

  return (await res.json()) as any
}

async function main() {
  let page = 1
  let pageCount = 1
  let totalInstances = 0
  let emptyBlogPosts = 0
  let emptyCategory = 0
  let completelyEmpty = 0
  const nonEmptySamples: {
    slug: string
    blogPostsLen: number
    hasCategory: boolean
  }[] = []

  while (page <= pageCount) {
    const res = await fetchPage(page)
    pageCount = res.meta.pagination.pageCount

    for (const post of res.data) {
      const slices = (post.attributes.slices ?? []) as any[]
      for (const s of slices) {
        if (s.__component !== "slices.related-posts") continue
        totalInstances++

        const bp = s.blogPosts?.data ?? []
        const cat = s.category?.data ?? null
        const bpEmpty = !Array.isArray(bp) || bp.length === 0
        const catEmpty = !cat

        if (bpEmpty) emptyBlogPosts++
        if (catEmpty) emptyCategory++
        if (bpEmpty && catEmpty) completelyEmpty++

        if (!bpEmpty || !catEmpty) {
          nonEmptySamples.push({
            slug: post.attributes.slug,
            blogPostsLen: Array.isArray(bp) ? bp.length : 0,
            hasCategory: !catEmpty,
          })
        }
      }
    }
    console.error(`page ${page}/${pageCount}`)
    page++
  }

  console.log("\n=== slices.related-posts audit ===")
  console.log(`instances:                 ${totalInstances}`)
  console.log(`empty blogPosts:           ${emptyBlogPosts}`)
  console.log(`empty category:            ${emptyCategory}`)
  console.log(`completely empty (both):   ${completelyEmpty}`)
  console.log(`non-empty instances:       ${totalInstances - completelyEmpty}`)
  if (nonEmptySamples.length) {
    console.log("\nNon-empty samples (first 20):")
    for (const s of nonEmptySamples.slice(0, 20)) {
      console.log(
        `  /${s.slug} — blogPosts=${s.blogPostsLen}, category=${s.hasCategory}`
      )
    }
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
