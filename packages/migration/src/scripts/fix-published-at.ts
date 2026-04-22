/**
 * One-time patch: populate `originalPublishedAt` on existing v5 entities
 * using the real publish dates from v4.
 *
 * Why this exists: Strapi v5's REST Content API overwrites `publishedAt` with
 * the server's current time on create/publish. The main migration therefore
 * produces rows whose `publishedAt` equals the migration timestamp, not the
 * article's real publish date. We introduced a user-defined datetime field
 * `originalPublishedAt` that Strapi does not normalize; this script backfills
 * it on already-migrated rows.
 *
 * Mechanism:
 *   1. Page through v4 with `fields[0]=slug&fields[1]=publishedAt` to build
 *      a `slug → publishedAt` map.
 *   2. Page through v5 (via TargetClient.list) to build
 *      `normalizedSlug → documentId` map.
 *   3. For each intersection, PUT /api/{endpoint}/{documentId}?status=published
 *      with `{ data: { originalPublishedAt: date } }`. Strapi re-publishes the
 *      draft so the field propagates to the published row. This re-bumps the
 *      system `publishedAt` to NOW, which was already wrong — no regression.
 */

import qs from "qs"

import { TargetClient } from "../clients/target.ts"
import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { normalizeV5Slug } from "../transforms/convert.ts"
import { createLogger, type Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

interface V4Row {
  id: number
  attributes: { slug?: string; publishedAt?: string | null }
}

interface V4ListResponse {
  data: V4Row[]
  meta: { pagination?: { page: number; pageCount: number } }
}

export interface FixOptions {
  entity: string
  sourceEndpoint: string
  targetEndpoint: string
  dryRun: boolean
  slugFilter?: string
  limit?: number
  verbose?: boolean
}

export async function runFixPublishedAt(opts: FixOptions): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)
  const target = new TargetClient({ env, logger })

  logger.header(
    `Fix publishedAt: ${opts.entity}${opts.dryRun ? " (dry-run)" : ""}`
  )

  const v4Dates = await fetchV4Dates(env, logger, opts.sourceEndpoint, opts)
  logger.info(
    `Fetched ${v4Dates.size} v4 ${opts.sourceEndpoint} with publishedAt`
  )

  const v5Docs = await fetchV5Documents(target, opts.targetEndpoint)
  logger.info(`Fetched ${v5Docs.size} v5 ${opts.targetEndpoint}`)

  const matches: { slug: string; documentId: string; date: string }[] = []
  const missing: string[] = []

  for (const [slug, date] of v4Dates) {
    const documentId = v5Docs.get(slug)

    if (documentId) {
      matches.push({ slug, documentId, date })
    } else {
      missing.push(slug)
    }
  }

  logger.info(
    `${matches.length} matched · ${missing.length} v4 entries without a v5 counterpart`
  )

  if (opts.verbose && missing.length > 0) {
    for (const slug of missing) logger.debug(`No v5 match: ${slug}`)
  }

  if (matches.length === 0) {
    logger.warn("Nothing to patch.")

    return
  }

  if (opts.dryRun) {
    logger.info("Sample (first 10):")

    for (const m of matches.slice(0, 10)) {
      logger.info(`  ${m.slug.padEnd(50)} ${m.date}  → ${m.documentId}`)
    }

    logger.info(`Would patch ${matches.length} entries.`)

    return
  }

  let ok = 0
  let failed = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]!
    const label = `${m.slug.padEnd(50)} ${m.date}`

    try {
      await withRetry(
        () => patchOne(env, opts.targetEndpoint, m.documentId, m.date),
        { logger }
      )
      ok++
      logger.progress(i + 1, matches.length, `OK   ${label}`)
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      logger.progress(i + 1, matches.length, `FAIL ${label} — ${msg}`)
    }
  }

  logger.divider()
  logger.info(
    `${opts.entity}: ${ok} patched · ${failed} failed of ${matches.length} total`
  )
  logger.divider()

  if (failed > 0) {
    throw new Error(`fix-published-at failed for ${failed} ${opts.entity}`)
  }
}

/** Fetch slug → publishedAt from v4, only fields we need. */
async function fetchV4Dates(
  env: MigrationEnv,
  logger: Logger,
  endpoint: string,
  opts: { slugFilter?: string; limit?: number }
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const seenDupes = new Map<string, number>()
  let page = 1
  const pageSize = 100

  while (true) {
    const params: Record<string, unknown> = {
      fields: ["slug", "publishedAt"],
      pagination: { page, pageSize },
      publicationState: "preview",
      locale: "en",
      sort: "id:asc",
    }

    if (opts.slugFilter) {
      const slugs = opts.slugFilter
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      params["filters"] =
        slugs.length > 1
          ? { slug: { $in: slugs } }
          : { slug: { $eq: slugs[0] } }
    }

    const url = `${env.source.baseUrl}/api/${endpoint}?${qs.stringify(params, {
      encodeValuesOnly: true,
    })}`
    logger.debug(`v4 fetch: ${url}`)

    const res = await withRetry(
      async () => {
        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${env.source.token}`,
            "Content-Type": "application/json",
          },
        })
        if (!r.ok) {
          const body = await r.text().catch(() => "")
          throw new Error(`v4 fetch ${r.status}: ${body.slice(0, 300)}`)
        }

        return (await r.json()) as V4ListResponse
      },
      { logger }
    )

    for (const row of res.data) {
      const rawSlug = row.attributes?.slug
      const publishedAt = row.attributes?.publishedAt

      if (typeof rawSlug !== "string" || !publishedAt) continue

      const slug = normalizeV5Slug(rawSlug)
      if (!slug) continue

      if (map.has(slug)) {
        seenDupes.set(slug, (seenDupes.get(slug) ?? 1) + 1)
        continue
      }

      map.set(slug, publishedAt)
    }

    const pag = res.meta.pagination
    if (!pag || page >= pag.pageCount) break

    if (opts.limit && map.size >= opts.limit) break

    page++
  }

  if (seenDupes.size > 0) {
    logger.warn(
      `Duplicate v4 slugs after normalization (kept first): ${[...seenDupes.keys()].join(", ")}`
    )
  }

  return opts.limit ? new Map([...map].slice(0, opts.limit)) : map
}

/** Fetch slug → documentId from v5 (draft state includes both draft+published). */
async function fetchV5Documents(
  target: TargetClient,
  endpoint: string
): Promise<Map<string, string>> {
  const rows = await target.list(endpoint)
  const map = new Map<string, string>()

  for (const row of rows) {
    const slug = row["slug"]
    const documentId = row.documentId

    if (typeof slug === "string" && typeof documentId === "string") {
      map.set(slug, documentId)
    }
  }

  return map
}

/**
 * PUT /api/{endpoint}/{documentId}?status=published
 * Updates the draft and re-publishes in one call so originalPublishedAt lands
 * on the published row.
 */
async function patchOne(
  env: MigrationEnv,
  endpoint: string,
  documentId: string,
  originalPublishedAt: string
): Promise<void> {
  const url = `${env.target.baseUrl}/api/${endpoint}/${documentId}?status=published`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { originalPublishedAt } }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 300)}`)
  }
}
