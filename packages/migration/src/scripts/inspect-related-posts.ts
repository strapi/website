import qs from "qs"

const SOURCE_URL = process.env["SOURCE_URL"]
const SOURCE_TOKEN = process.env["SOURCE_TOKEN"]

if (!SOURCE_URL || !SOURCE_TOKEN) {
  console.error("Missing env")
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

const SLUGS = [
  "git-based-vs-api-first-cms",
  "top-jamstack-features",
  "webhooks",
  "everything-you-need-to-know-about-content-modeling",
  "understanding-the-different-types-categories-of-strapi-hooks",
]

async function fetchPost(slug: string) {
  const query = qs.stringify(
    {
      filters: { slug: { $eq: slug } },
      publicationState: "preview",
      locale: "en",
      populate: {
        slices: {
          on: {
            "slices.related-posts": { populate: "*" },
            "slices.related-blog-posts": { populate: "*" },
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

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)

  return (await res.json()) as { data: { id: number; attributes: any }[] }
}

async function main() {
  for (const slug of SLUGS) {
    const res = await fetchPost(slug)
    const post = res.data[0]
    if (!post) {
      console.log(`\n❌ ${slug} — not found`)
      continue
    }

    console.log(`\n=== /${slug} (id=${post.id}) ===`)
    const slices = (post.attributes.slices ?? []) as any[]
    for (const s of slices) {
      if (
        s.__component !== "slices.related-posts" &&
        s.__component !== "slices.related-blog-posts"
      )
        continue

      console.log(`\n  · ${s.__component} (id=${s.id})`)
      const keys = Object.keys(s).filter(
        (k) => k !== "__component" && k !== "id"
      )
      for (const k of keys) {
        const v = s[k]
        const summary = Array.isArray(v)
          ? `[${v.length}]`
          : v === null
            ? "null"
            : typeof v === "object"
              ? v.data === null
                ? "null"
                : Array.isArray(v.data)
                  ? `relation[${v.data.length}]`
                  : v.data
                    ? `relation(id=${v.data.id})`
                    : JSON.stringify(v).slice(0, 80)
              : JSON.stringify(v).slice(0, 80)
        console.log(`      ${k}: ${summary}`)
      }
    }
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error(err)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})
