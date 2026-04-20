import qs from "qs"

const SOURCE_URL = process.env["SOURCE_URL"]
const SOURCE_TOKEN = process.env["SOURCE_TOKEN"]
// eslint-disable-next-line unicorn/no-process-exit
if (!SOURCE_URL || !SOURCE_TOKEN) process.exit(1)

const TARGETS = [
  "slices.new-cta",
  "slices.related-tutorials",
  "slices.embed-form",
]

async function fetchPage(page: number) {
  const query = qs.stringify(
    {
      pagination: { page, pageSize: 100 },
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)

  return (await res.json()) as any
}

async function main() {
  const hits: Record<
    string,
    { slug: string; title: string; published: boolean }[]
  > = {}
  for (const t of TARGETS) hits[t] = []

  let page = 1
  let pageCount = 1

  while (page <= pageCount) {
    const res = await fetchPage(page)
    pageCount = res.meta.pagination.pageCount

    for (const post of res.data) {
      const slices = (post.attributes.slices ?? []) as { __component: string }[]
      const components = new Set(slices.map((s) => s.__component))
      for (const t of TARGETS) {
        if (components.has(t)) {
          hits[t]!.push({
            slug: post.attributes.slug,
            title: post.attributes.title ?? "(no title)",
            published: Boolean(post.attributes.publishedAt),
          })
        }
      }
    }
    console.error(`page ${page}/${pageCount}`)
    page++
  }

  for (const t of TARGETS) {
    console.log(`\n=== ${t} — ${hits[t]!.length} hit(s) ===`)
    for (const h of hits[t]!) {
      console.log(`  [${h.published ? "P" : "D"}] /${h.slug}  — ${h.title}`)
    }
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((e) => {
  console.error(e)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})
