/**
 * Diagnostic: compare draft/publish state between v4 source and v5 target.
 *
 * For the most recently updated v4 blog posts, looks up the v5 counterpart by
 * slug and prints both rows' publish state so we can see where the migration
 * left posts as drafts vs. published.
 *
 * Run: pnpm migrate diagnose-draft-state [--entity blog-posts] [--limit 20]
 */

import qs from "qs"

import { loadEnv } from "../config/env.ts"
import { normalizeV5Slug } from "../transforms/convert.ts"

interface V4Row {
  id: number
  attributes: {
    slug?: string
    title?: string
    publishedAt?: string | null
    updatedAt?: string
  }
}

interface V5Row {
  id: number
  documentId: string
  slug?: string
  publishedAt?: string | null
  originalPublishedAt?: string | null
  updatedAt?: string
}

interface V4List {
  data: V4Row[]
}
interface V5List {
  data: V5Row[]
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const entityArg = args.find((a) => a.startsWith("--entity="))
  const limitArg = args.find((a) => a.startsWith("--limit="))

  const sourceEndpoint = entityArg?.split("=")[1] ?? "blog-posts"
  const targetEndpoint = sourceEndpoint
  const limit = Number(limitArg?.split("=")[1] ?? "20")

  const env = loadEnv()

  // 1) Pull N most recently updated v4 rows (lightweight fields).
  const v4Params = qs.stringify(
    {
      fields: ["slug", "title", "publishedAt", "updatedAt"],
      pagination: { page: 1, pageSize: limit },
      publicationState: "preview",
      locale: "en",
      sort: "updatedAt:desc",
    },
    { encodeValuesOnly: true }
  )
  const v4Url = `${env.source.baseUrl}/api/${sourceEndpoint}?${v4Params}`
  const v4Res = await fetch(v4Url, {
    headers: { Authorization: `Bearer ${env.source.token}` },
  })
  if (!v4Res.ok) {
    throw new Error(`v4 fetch failed: ${v4Res.status} ${v4Res.statusText}`)
  }
  const v4 = (await v4Res.json()) as V4List

  // 2) For each v4 row, look up v5 by normalized slug — query BOTH draft+published.
  const rows: {
    v4: V4Row
    v5Draft?: V5Row
    v5Published?: V5Row
  }[] = []

  for (const v4Row of v4.data) {
    const rawSlug = v4Row.attributes.slug
    if (!rawSlug) continue

    const slug = normalizeV5Slug(rawSlug)
    if (!slug) continue

    const v5DraftRow = await fetchV5BySlug(env, targetEndpoint, slug, "draft")
    const v5PubRow = await fetchV5BySlug(env, targetEndpoint, slug, "published")

    rows.push({ v4: v4Row, v5Draft: v5DraftRow, v5Published: v5PubRow })
  }

  // 3) Tabular report.
  console.log()
  console.log(`Entity: ${sourceEndpoint}  (top ${limit} by updatedAt:desc)`)
  console.log(
    "=".repeat(160) +
      "\n" +
      [
        pad("slug", 50),
        pad("v4.pubAt", 22),
        pad("v5.draftPubAt", 22),
        pad("v5.pubPubAt", 22),
        pad("v5.origPubAt", 22),
        pad("status", 14),
      ].join("  ")
  )
  console.log("-".repeat(160))

  let drafts = 0
  let published = 0
  let missing = 0
  let mismatched = 0

  for (const r of rows) {
    const slug = normalizeV5Slug(r.v4.attributes.slug ?? "?") ?? "?"
    const v4Pub = r.v4.attributes.publishedAt ?? null

    const draftPubAt = r.v5Draft?.publishedAt ?? null
    const pubPubAt = r.v5Published?.publishedAt ?? null
    const origPubAt = r.v5Draft?.originalPublishedAt ?? null

    const status = classify(v4Pub, r.v5Draft, r.v5Published)

    switch (status) {
      case "MISSING":
        missing++
        break
      case "v4-pub→v5-draft":
        drafts++
        mismatched++
        break
      case "v4-draft→v5-pub":
        mismatched++
        break
      case "OK (published)":
        published++
        break

      default:
        drafts++
    }

    console.log(
      [
        pad(slug.slice(0, 50), 50),
        pad(v4Pub ?? "(null)", 22),
        pad(draftPubAt ?? "(null)", 22),
        pad(pubPubAt ?? "(none)", 22),
        pad(origPubAt ?? "(null)", 22),
        pad(status, 14),
      ].join("  ")
    )
  }

  console.log("-".repeat(160))
  console.log(
    `Summary: ${rows.length} checked · ${published} OK pub · ${drafts} draft · ${missing} missing · ${mismatched} state mismatch`
  )
}

async function fetchV5BySlug(
  env: ReturnType<typeof loadEnv>,
  endpoint: string,
  slug: string,
  status: "draft" | "published"
): Promise<V5Row | undefined> {
  const params = qs.stringify(
    {
      filters: { slug: { $eq: slug } },
      fields: ["slug", "publishedAt", "originalPublishedAt", "updatedAt"],
      locale: "en",
      status,
    },
    { encodeValuesOnly: true }
  )
  const url = `${env.target.baseUrl}/api/${endpoint}?${params}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.target.token}` },
  })

  if (!res.ok) {
    throw new Error(
      `v5 fetch (${status}) failed for ${slug}: ${res.status} ${res.statusText}`
    )
  }

  const json = (await res.json()) as V5List

  return json.data[0]
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length)
}

function classify(
  v4Pub: string | null,
  v5Draft: V5Row | undefined,
  v5Published: V5Row | undefined
): string {
  if (!v5Draft && !v5Published) return "MISSING"
  if (v4Pub && !v5Published) return "v4-pub→v5-draft"
  if (!v4Pub && v5Published) return "v4-draft→v5-pub"
  if (v4Pub && v5Published) return "OK (published)"

  return "OK (draft)"
}

await main()
