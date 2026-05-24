/**
 * Re-host v4-CDN images embedded inside richtext/markdown fields on already-
 * migrated v5 entries.
 *
 * The main migration's `uploadMedia` transform only walks structured component
 * media (basic-image with fallbackSrc). It misses `![alt](url)` and
 * `<img src="url">` syntax inside markdown bodies, so those references stay
 * pointed at the v4 CDN even after migration.
 *
 * This script pages through v5 entries (both draft and published rows), walks
 * each entity for v4-CDN image refs, uploads them to v5 via TargetClient,
 * and PUTs the rewritten fields back. Dry-run by default — only counts what
 * would change without uploading or writing.
 */

import qs from "qs"

import { TargetClient } from "../clients/target.ts"
import { COMPONENT_MAP } from "../config/components.ts"
import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { IdMap } from "../state/id-map.ts"
import { MediaCache } from "../state/media-cache.ts"
import { PendingRelations } from "../state/pending-relations.ts"
import type { TransformContext } from "../transforms/base.ts"
import { processMarkdownImages } from "../transforms/markdown-images.ts"
import { createLogger, type Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"
import { stripIds } from "../utils/strip-ids.ts"

interface V5Row {
  documentId: string
  slug?: string
  [k: string]: unknown
}

const SYSTEM_FIELDS = new Set([
  "id",
  "documentId",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "locale",
  "originalPublishedAt",
])

/**
 * Per-endpoint dynamic-zone field name. Strapi rejects populate keys for
 * fields that don't exist on the model, so we look it up by endpoint rather
 * than blindly populating both `content` and `sections`.
 */
const DZ_FIELD_BY_ENDPOINT: Record<string, string> = {
  "blog-posts": "sections",
  pages: "content",
  "case-studies": "content",
  cmses: "sections",
  "cms-comparisons": "content",
}

interface V5List {
  data: V5Row[]
  meta: { pagination?: { page: number; pageSize: number; pageCount: number } }
}

export interface FixOptions {
  entity: string
  targetEndpoint: string
  apply: boolean
  limit?: number
  verbose?: boolean
}

// URL group allows one level of balanced parens (e.g. `Untitled_(1).png`).
const MARKDOWN_IMG = /!\[[^\]]*\]\(((?:[^()\s]|\([^()]*\))+)(?:\s+"[^"]*")?\)/g
const HTML_IMG_SRC = /<img\b[^>]*\bsrc=["']([^"']+)["']/g

export async function runFixMarkdownImages(opts: FixOptions): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)
  const target = new TargetClient({ env, logger })
  const mediaCache = new MediaCache()
  await mediaCache.load()

  const ctx: TransformContext = {
    env,
    sourceClient: undefined as never,
    targetClient: target,
    idMap: new IdMap(),
    mediaCache,
    pendingRelations: new PendingRelations(),
    logger,
    componentMap: COMPONENT_MAP,
    dryRun: !opts.apply,
    force: false,
  }

  logger.header(
    `Fix markdown images: ${opts.entity}${opts.apply ? "" : " (dry-run)"}`
  )

  let totalChanged = 0
  let totalImages = 0
  let totalImageFailures = 0
  let totalRowFailures = 0

  for (const status of ["draft", "published"] as const) {
    const rows = await fetchAll(
      env,
      logger,
      opts.targetEndpoint,
      status,
      opts.limit
    )
    logger.info(`status=${status}: scanned ${rows.length} rows`)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const original = pickContentFields(row)
      const imagesBefore = countV4Images(env, original)

      if (imagesBefore === 0) continue

      const label = (row.slug ?? row.documentId).padEnd(50)

      if (!opts.apply) {
        totalChanged++
        totalImages += imagesBefore
        logger.progress(
          i + 1,
          rows.length,
          `DRY  ${label} would rewrite ${imagesBefore} imgs (status=${status})`
        )
        continue
      }

      const updated = (await processMarkdownImages(original, ctx)) as Record<
        string,
        unknown
      >

      const imagesAfter = countV4Images(env, updated)
      const rewroteCount = imagesBefore - imagesAfter
      const failedUploads = imagesBefore - rewroteCount

      if (failedUploads > 0) {
        totalImageFailures += failedUploads
      }

      if (rewroteCount === 0) {
        logger.progress(
          i + 1,
          rows.length,
          `SKIP ${label} all ${imagesBefore} imgs failed download (likely broken/deleted on v4)`
        )
        continue
      }

      // Build payload from only the fields that actually changed — minimizes
      // risk of unintentionally overwriting fields where populate="*" didn't
      // capture deeply-nested data.
      const payload: Record<string, unknown> = {}

      for (const [k, v] of Object.entries(updated)) {
        if (JSON.stringify(v) !== JSON.stringify(original[k])) {
          payload[k] = v
        }
      }

      if (Object.keys(payload).length === 0) {
        // Shouldn't happen since rewroteCount > 0, but guard against it.
        continue
      }

      try {
        await withRetry(
          () =>
            putEntity(
              env,
              opts.targetEndpoint,
              row.documentId,
              status,
              stripIds(payload) as Record<string, unknown>
            ),
          { logger }
        )
        totalChanged++
        totalImages += rewroteCount
        logger.progress(
          i + 1,
          rows.length,
          `OK   ${label} rewrote ${rewroteCount} imgs (status=${status})`
        )
      } catch (err) {
        totalRowFailures++
        const msg = err instanceof Error ? err.message : String(err)
        logger.progress(i + 1, rows.length, `FAIL ${label} ${msg}`)
      }
    }
  }

  await mediaCache.save()

  logger.divider()

  if (opts.apply) {
    logger.info(
      `Updated ${totalChanged} rows · rewrote ${totalImages} v4 image refs`
    )

    if (totalImageFailures > 0) {
      logger.warn(
        `${totalImageFailures} individual image(s) couldn't be downloaded (likely deleted on v4 — markdown left pointing at original URL)`
      )
    }

    if (totalRowFailures > 0) {
      logger.error(`${totalRowFailures} row PUT(s) failed`)
    }
  } else {
    logger.info(
      `Would update ${totalChanged} rows · would rewrite ${totalImages} v4 image refs (run with --apply)`
    )
  }

  logger.divider()

  // Only abort on row write failures — broken v4 images are data issues, not
  // script errors, and shouldn't fail the run.
  if (totalRowFailures > 0 && opts.apply) {
    throw new Error(
      `fix-markdown-images: ${totalRowFailures} row write failure(s)`
    )
  }
}

async function fetchAll(
  env: MigrationEnv,
  logger: Logger,
  endpoint: string,
  status: "draft" | "published",
  limit: number | undefined
): Promise<V5Row[]> {
  const out: V5Row[] = []
  const pageSize = 100
  let page = 1

  // Deep populate the DZ field for this endpoint so PUT round-trips include
  // every component's nested fields (e.g. media.image's `image` relation).
  // Without this, Strapi's required-field validation rejects payloads where
  // populated components are missing fields populate="*" didn't reach.
  // Scalar fields (richtext, strings) are always returned even without
  // populate; relations not listed are omitted by design — we filter them out
  // anyway via looksLikeRelation. Strapi rejects populate keys that don't
  // exist on the model, so we keep this per-endpoint.
  const dzField = DZ_FIELD_BY_ENDPOINT[endpoint]
  const populate = dzField ? { [dzField]: { populate: "*" } } : "*"

  while (true) {
    const params = qs.stringify(
      {
        populate,
        status,
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
 * Strip system fields (id, documentId, createdAt, ...) AND populated relations
 * so the result contains only the entity's own content (scalars + components).
 *
 * Relations populated via `populate=*` come back as `{documentId, ...}` objects
 * (or arrays thereof) and Strapi v5 PUT rejects payloads where relation fields
 * contain `documentId`. They also represent OTHER documents — re-hosting v4
 * URLs found inside them would fix the wrong row. Each owning entity is
 * processed independently when its own collection is scanned.
 */
function pickContentFields(row: V5Row): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(row)) {
    if (SYSTEM_FIELDS.has(k)) continue
    if (looksLikeRelation(v)) continue
    // Empty arrays look indistinguishable from a cleared relation to Strapi
    // and would force `{ field: [] }` into the PUT payload — clearing the
    // relation. Skip them; the diff-against-original guard catches them too,
    // but defense-in-depth is cheap.
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }

  return out
}

/**
 * Strapi v5 components carry `id` but no `documentId`; only top-level
 * documents (collection types / media) have `documentId`. We use that as the
 * relation marker.
 */
function looksLikeRelation(value: unknown): boolean {
  if (Array.isArray(value)) {
    return (
      value.length > 0 &&
      typeof value[0] === "object" &&
      value[0] !== null &&
      "documentId" in (value[0] as object)
    )
  }

  return (
    value !== null &&
    typeof value === "object" &&
    "documentId" in (value as object)
  )
}

function countV4Images(env: MigrationEnv, obj: unknown): number {
  const host = new URL(env.source.baseUrl).host
  const hostRe = new RegExp(
    String.raw`^https?://${host.replaceAll(".", String.raw`\.`)}\b`,
    "i"
  )

  let count = 0

  function walk(node: unknown): void {
    if (typeof node === "string") {
      for (const m of node.matchAll(MARKDOWN_IMG)) {
        if (m[1] && hostRe.test(m[1])) count++
      }

      for (const m of node.matchAll(HTML_IMG_SRC)) {
        if (m[1] && hostRe.test(m[1])) count++
      }

      return
    }

    if (Array.isArray(node)) {
      for (const item of node) walk(item)

      return
    }

    if (node !== null && typeof node === "object") {
      for (const v of Object.values(node)) walk(v)
    }
  }

  walk(obj)

  return count
}

async function putEntity(
  env: MigrationEnv,
  endpoint: string,
  documentId: string,
  status: "draft" | "published",
  data: Record<string, unknown>
): Promise<void> {
  const url = `${env.target.baseUrl}/api/${endpoint}/${documentId}?status=${status}`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 300)}`)
  }
}
