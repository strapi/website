/**
 * Backfill `originalPublishedAt` for v5 entities created natively (i.e. not
 * via the v4→v5 migration). Posts authored directly in v5 don't get the
 * field set, so they sort to the bottom of `originalPublishedAt: desc`
 * queries because of NULL-last ordering.
 *
 * For each entity at the given endpoint where `publishedAt` is set but
 * `originalPublishedAt` is NULL, this PUTs to
 *   /api/{endpoint}/{documentId}?status=published
 * with `{ data: { originalPublishedAt: publishedAt } }`. The lifecycle hook
 * already covers new writes — this script is for rows that pre-date the fix.
 *
 * Differs from `fix-published-at.ts` (v4→v5 dates) in that the source of
 * truth is the v5 entity's own `publishedAt`. No v4 instance required.
 */

import { TargetClient } from "../clients/target.ts"
import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { createLogger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

export interface BackfillOptions {
  entity: string
  targetEndpoint: string
  dryRun: boolean
  slugFilter?: string
  limit?: number
  verbose?: boolean
}

export async function runBackfillOriginalPublishedAt(
  opts: BackfillOptions
): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)
  const target = new TargetClient({ env, logger })

  logger.header(
    `Backfill originalPublishedAt: ${opts.entity}${opts.dryRun ? " (dry-run)" : ""}`
  )

  const rows = await target.list(opts.targetEndpoint, {}, "published")
  logger.info(`Fetched ${rows.length} v5 ${opts.targetEndpoint}`)

  const slugSet = parseSlugFilter(opts.slugFilter)

  const candidates = rows
    .filter((row) => {
      if (typeof row["publishedAt"] !== "string") return false
      if (row["originalPublishedAt"]) return false

      if (slugSet) {
        const slug = row["slug"]

        return typeof slug === "string" && slugSet.has(slug)
      }

      return true
    })
    .slice(0, opts.limit)

  logger.info(`${candidates.length} entries need backfill`)

  if (candidates.length === 0) {
    logger.warn("Nothing to patch.")

    return
  }

  if (opts.dryRun) {
    logger.info("Sample (first 10):")

    for (const row of candidates.slice(0, 10)) {
      const slug = String(row["slug"] ?? "(no slug)")
      const date = String(row["publishedAt"])
      logger.info(`  ${slug.padEnd(50)} ${date}  → ${row.documentId}`)
    }

    logger.info(`Would patch ${candidates.length} entries.`)

    return
  }

  let ok = 0
  let failed = 0

  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i]!
    const slug = String(row["slug"] ?? row.documentId)
    const date = String(row["publishedAt"])
    const label = `${slug.padEnd(50)} ${date}`

    try {
      await withRetry(
        () => patchOne(env, opts.targetEndpoint, row.documentId, date),
        { logger }
      )
      ok++
      logger.progress(i + 1, candidates.length, `OK   ${label}`)
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      logger.progress(i + 1, candidates.length, `FAIL ${label} — ${msg}`)
    }
  }

  logger.divider()
  logger.info(
    `${opts.entity}: ${ok} patched · ${failed} failed of ${candidates.length} total`
  )
  logger.divider()

  if (failed > 0) {
    throw new Error(
      `backfill-original-published-at failed for ${failed} ${opts.entity}`
    )
  }
}

function parseSlugFilter(slugFilter?: string): Set<string> | undefined {
  if (!slugFilter) return undefined

  const slugs = slugFilter
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return slugs.length > 0 ? new Set(slugs) : undefined
}

/**
 * PUT /api/{endpoint}/{documentId}?status=published with originalPublishedAt.
 * Re-publishes the draft so the field lands on the published row. This will
 * bump the system `publishedAt` to NOW — fine for natively-created posts
 * because we're using the current `publishedAt` as the source value, so
 * losing the original write timestamp is acceptable.
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
