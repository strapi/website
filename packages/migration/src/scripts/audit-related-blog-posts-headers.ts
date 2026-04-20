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
            "slices.related-blog-posts": {
              populate: ["gradientHeader", "intro"],
            },
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
  const titles = new Map<string, number>()
  const texts = new Map<string, number>()
  const labels = new Map<string, number>()
  let total = 0
  let withIntro = 0
  let emptyIntro = 0

  let page = 1
  let pageCount = 1
  while (page <= pageCount) {
    const res = await fetchPage(page)
    pageCount = res.meta.pagination.pageCount

    for (const post of res.data) {
      const slices = (post.attributes.slices ?? []) as any[]
      for (const s of slices) {
        if (s.__component !== "slices.related-blog-posts") continue
        total++

        const intro = s.intro
        if (!intro || Object.keys(intro).length === 0) {
          emptyIntro++
          continue
        }
        withIntro++

        const title = (intro.title ?? "").trim() || "(empty)"
        const text = (intro.text ?? "").trim() || "(empty)"
        const label = (intro.label ?? "").trim() || "(empty)"
        titles.set(title, (titles.get(title) ?? 0) + 1)
        texts.set(text, (texts.get(text) ?? 0) + 1)
        labels.set(label, (labels.get(label) ?? 0) + 1)
      }
    }
    console.error(`page ${page}/${pageCount}`)
    page++
  }

  const top = (m: Map<string, number>, n = 10) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)

  console.log(`\ntotal instances:   ${total}`)
  console.log(`with intro:        ${withIntro}`)
  console.log(`empty intro:       ${emptyIntro}`)

  console.log("\nTop 10 titles:")
  for (const [k, v] of top(titles)) console.log(`  ${v}×  ${k}`)
  console.log("\nTop 10 texts:")
  for (const [k, v] of top(texts)) console.log(`  ${v}×  ${k}`)
  console.log("\nTop 10 labels:")
  for (const [k, v] of top(labels)) console.log(`  ${v}×  ${k}`)

  console.log(`\nUnique titles: ${titles.size}`)
  console.log(`Unique texts:  ${texts.size}`)
  console.log(`Unique labels: ${labels.size}`)
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
