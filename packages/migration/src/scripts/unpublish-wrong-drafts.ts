/**
 * Unpublish v5 entries that were wrongly published by the broken blog-posts
 * transform (publishedAt left in payload → Strapi v5 auto-published every POST,
 * including v4 drafts).
 *
 * Identification: query DRAFT rows with `originalPublishedAt IS NULL`. The
 * draft is the source of truth here — the Strapi lifecycle hook backfills
 * `originalPublishedAt = publishedAt` on the published row when publishedAt
 * arrives in the create payload, so the published row's originalPublishedAt
 * is the migration timestamp, not null. The draft row is left untouched and
 * its originalPublishedAt stays null for v4 drafts (vs. the v4 date for
 * v4-published entries).
 *
 * Unpublish via `DELETE /api/{endpoint}/{documentId}?status=published`, which
 * deletes only the published row and leaves the draft intact. 404 responses
 * are tolerated (draft without a published version is the desired end state).
 *
 * Dry-run by default. Pass --apply to perform deletions.
 */

import qs from "qs"

import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { createLogger, type Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

interface V5Row {
  documentId: string
  slug?: string
  publishedAt?: string | null
  originalPublishedAt?: string | null
}

interface V5List {
  data: V5Row[]
  meta: { pagination?: { page: number; pageCount: number } }
}

export interface UnpublishOptions {
  entity: string
  targetEndpoint: string
  apply: boolean
  limit?: number
  verbose?: boolean
}

export async function runUnpublishWrongDrafts(
  opts: UnpublishOptions
): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)

  logger.header(
    `Unpublish wrong drafts: ${opts.entity}${opts.apply ? "" : " (dry-run)"}`
  )

  // The unpublish target is "draft rows with originalPublishedAt = null",
  // which is only safe if the Strapi lifecycle hook backfills
  // `originalPublishedAt = publishedAt` on the published row at create time.
  // If that hook is missing, legitimately-published rows will also have
  // null originalPublishedAt and we'd unpublish real content. Probe the
  // PUBLISHED collection first — if any null values exist there, abort.
  await assertLifecycleHookPresent(env, logger, opts.targetEndpoint)

  const rows = await fetchWronglyPublished(
    env,
    logger,
    opts.targetEndpoint,
    opts.limit
  )

  logger.info(
    `Found ${rows.length} draft rows with originalPublishedAt=null (candidates for unpublish)`
  )

  if (rows.length === 0) {
    logger.info("Nothing to unpublish.")

    return
  }

  if (!opts.apply) {
    logger.info("Sample (first 10):")

    for (const r of rows.slice(0, 10)) {
      logger.info(`  ${(r.slug ?? "?").padEnd(60)} ${r.documentId}`)
    }

    logger.warn(`Would unpublish ${rows.length} entries. Pass --apply to run.`)

    return
  }

  let ok = 0
  let noop = 0
  let failed = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const label = (r.slug ?? r.documentId).padEnd(60)

    try {
      const result = await withRetry(
        () => unpublishOne(env, opts.targetEndpoint, r.documentId),
        { logger }
      )

      if (result === "unpublished") {
        ok++
        logger.progress(i + 1, rows.length, `OK   ${label}`)
      } else {
        noop++
        logger.progress(i + 1, rows.length, `SKIP ${label} (no published)`)
      }
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      logger.progress(i + 1, rows.length, `FAIL ${label} — ${msg}`)
    }
  }

  logger.divider()
  logger.info(
    `${ok} unpublished · ${noop} no-op (already draft-only) · ${failed} failed of ${rows.length} total`
  )
  logger.divider()

  if (failed > 0) {
    throw new Error(`unpublish-wrong-drafts failed for ${failed} entries`)
  }
}

async function fetchWronglyPublished(
  env: MigrationEnv,
  logger: Logger,
  endpoint: string,
  limit?: number
): Promise<V5Row[]> {
  const out: V5Row[] = []
  const pageSize = 100
  let page = 1

  while (true) {
    const params = qs.stringify(
      {
        filters: { originalPublishedAt: { $null: true } },
        fields: ["slug", "publishedAt", "originalPublishedAt"],
        status: "draft",
        locale: "en",
        pagination: { page, pageSize },
      },
      { encodeValuesOnly: true }
    )
    const url = `${env.target.baseUrl}/api/${endpoint}?${params}`
    logger.debug(`v5 fetch: ${url}`)

    const res = await withRetry(
      async () => {
        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${env.target.token}`,
            "Content-Type": "application/json",
          },
        })
        if (!r.ok) {
          const body = await r.text().catch(() => "")
          throw new Error(`v5 fetch ${r.status}: ${body.slice(0, 300)}`)
        }

        return (await r.json()) as V5List
      },
      { logger }
    )

    out.push(...res.data)

    const pag = res.meta.pagination
    if (!pag || page >= pag.pageCount) break

    if (limit && out.length >= limit) break

    page++
  }

  return limit ? out.slice(0, limit) : out
}

/**
 * Refuse to run if any PUBLISHED row has `originalPublishedAt = null`. That
 * would mean the lifecycle hook this script depends on isn't wired up and the
 * null-draft heuristic is unsafe.
 */
async function assertLifecycleHookPresent(
  env: MigrationEnv,
  logger: Logger,
  endpoint: string
): Promise<void> {
  const params = qs.stringify(
    {
      filters: { originalPublishedAt: { $null: true } },
      fields: ["slug"],
      status: "published",
      locale: "en",
      pagination: { page: 1, pageSize: 1 },
    },
    { encodeValuesOnly: true }
  )
  const url = `${env.target.baseUrl}/api/${endpoint}?${params}`

  const res = await withRetry(
    async () => {
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${env.target.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!r.ok) {
        const body = await r.text().catch(() => "")
        throw new Error(`v5 fetch ${r.status}: ${body.slice(0, 300)}`)
      }

      return (await r.json()) as {
        meta: { pagination?: { total: number } }
      }
    },
    { logger }
  )

  const total = res.meta.pagination?.total ?? 0

  if (total > 0) {
    throw new Error(
      `Refusing to run: ${total} PUBLISHED row(s) have originalPublishedAt=null on ${endpoint}. ` +
        `The null-draft detection relies on a Strapi lifecycle hook backfilling originalPublishedAt — ` +
        `that hook isn't running. Fix the hook (or backfill the published rows) before retrying.`
    )
  }

  logger.debug(
    `Lifecycle-hook sanity check OK for ${endpoint} (no published rows with null originalPublishedAt).`
  )
}

async function unpublishOne(
  env: MigrationEnv,
  endpoint: string,
  documentId: string
): Promise<"unpublished" | "no-op"> {
  const url = `${env.target.baseUrl}/api/${endpoint}/${documentId}?status=published`

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 404) return "no-op"

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 300)}`)
  }

  return "unpublished"
}
