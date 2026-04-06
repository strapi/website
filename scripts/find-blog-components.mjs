#!/usr/bin/env node

/**
 * Queries a Strapi v4 production API to find which dynamic zone components
 * are actually used in blog-post content (slices field).
 *
 * Usage:
 *   node scripts/find-blog-components.mjs <STRAPI_URL> <API_TOKEN>
 *
 * Example:
 *   node scripts/find-blog-components.mjs https://strapi.example.com abc123token
 */

// eslint-disable-next-line unicorn/no-unreadable-array-destructuring
const [, , baseUrl, apiToken] = process.argv

if (!baseUrl || !apiToken) {
  console.error(
    "Usage: node scripts/find-blog-components.mjs <STRAPI_URL> <API_TOKEN>"
  )
  process.exit(1)
}

const PAGE_SIZE = 100

async function fetchPage(page) {
  const params = new URLSearchParams({
    "populate[slices][populate]": "*",
    "pagination[page]": page,
    "pagination[pageSize]": PAGE_SIZE,
    publicationState: "preview", // include drafts too
  })

  const url = `${baseUrl.replace(/\/$/, "")}/api/blog-posts?${params}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`)
  }

  return res.json()
}

async function main() {
  const componentCounts = {}
  const componentPosts = {}
  let page = 1
  let totalPosts = 0

  console.log(`Fetching blog posts from ${baseUrl}...\n`)

  while (true) {
    const { data, meta } = await fetchPage(page)

    for (const post of data) {
      const attrs = post.attributes ?? post
      const title = attrs.title ?? `(id: ${post.id})`
      const slices = attrs.slices ?? []

      totalPosts++

      for (const slice of slices) {
        const component = slice.__component
        if (!component) continue

        componentCounts[component] = (componentCounts[component] ?? 0) + 1

        if (!componentPosts[component]) {
          componentPosts[component] = []
        }
        if (componentPosts[component].length < 3) {
          componentPosts[component].push(title)
        }
      }
    }

    const { pagination } = meta
    const totalPages = pagination.pageCount
    console.log(`  Page ${page}/${totalPages} (${data.length} posts)`)

    if (page >= totalPages) break
    page++
  }

  console.log(`\n========================================`)
  console.log(`Total blog posts scanned: ${totalPosts}`)
  console.log(`Unique components found: ${Object.keys(componentCounts).length}`)
  console.log(`========================================\n`)

  const sorted = Object.entries(componentCounts).sort((a, b) => b[1] - a[1])

  console.log("Component usage (sorted by count):\n")
  for (const [component, count] of sorted) {
    const examples = componentPosts[component].join(", ")
    console.log(`  ${component}: ${count}x  (e.g. ${examples})`)
  }

  // Compare with new schema
  const newSchemaComponents = new Set([
    "sections.section-header",
    "sections.faq-section",
    "sections.two-column-grid",
    "cards.content-card",
    "media.image",
    "media.image-gallery",
    "media.video",
    "testimonials.quote",
    "forms.newsletter",
    "forms.hubspot-form",
    "migration.data-sink",
  ])

  const usedComponents = sorted.map(([c]) => c)
  const notInNewSchema = usedComponents.filter(
    (c) => !newSchemaComponents.has(c)
  )

  if (notInNewSchema.length > 0) {
    console.log(`\n========================================`)
    console.log(`Components used in production but NOT in new schema:`)
    console.log(`========================================\n`)
    for (const c of notInNewSchema) {
      console.log(`  - ${c} (${componentCounts[c]}x)`)
    }
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
