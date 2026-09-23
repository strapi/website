/**
 * Replace YouTube `<iframe>` tags in blog-post `content` with a markdown
 * paragraph the frontend auto-embed path understands:
 *
 *   [https://www.youtube.com/watch?v=VIDEO_ID](https://www.youtube.com/watch?v=VIDEO_ID)
 *
 * Pages through draft and published rows and (with --apply) PUTs only
 * `content` back. Dry-run by default.
 */

import qs from "qs"

import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { rewriteYouTubeIframes } from "../transforms/youtube-iframes.ts"
import { createLogger, type Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

const ENDPOINT = "blog-posts"

interface V5Row {
  documentId: string
  slug?: string
  content?: string | null
}

interface V5List {
  data: V5Row[]
  meta: { pagination?: { page: number; pageSize: number; pageCount: number } }
}

export interface FixYoutubeIframesOptions {
  apply: boolean
  limit?: number
  verbose?: boolean
}

export async function runFixYoutubeIframes(
  opts: FixYoutubeIframesOptions
): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)

  logger.header(
    `Fix YouTube iframes in blog-post content${opts.apply ? "" : " (dry-run)"}`
  )

  let totalRows = 0
  let totalIframes = 0
  let totalRowFailures = 0

  for (const status of ["draft", "published"] as const) {
    const rows = await fetchAll(env, logger, status, opts.limit)
    logger.info(`status=${status}: scanned ${rows.length} rows`)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const original = row.content
      if (
        typeof original !== "string" ||
        !original.toLowerCase().includes("<iframe")
      ) {
        continue
      }

      const { text, count } = rewriteYouTubeIframes(original)
      if (count === 0) continue

      const slug = row.slug || "no-slug"
      const label = slug.padEnd(50)
      totalRows++
      totalIframes += count

      if (!opts.apply) {
        logger.progress(
          i + 1,
          rows.length,
          `DRY  ${label} would rewrite ${count} iframe(s) (status=${status})`
        )
        continue
      }

      try {
        await withRetry(() => putContent(env, row.documentId, status, text), {
          logger,
        })
        logger.progress(
          i + 1,
          rows.length,
          `OK   ${label} rewrote ${count} iframe(s) (status=${status})`
        )
      } catch (err) {
        totalRowFailures++
        const msg = err instanceof Error ? err.message : String(err)
        logger.progress(i + 1, rows.length, `FAIL ${label} ${msg}`)
      }
    }
  }

  logger.divider()

  if (opts.apply) {
    logger.info(
      `Updated ${totalRows - totalRowFailures} rows · rewrote ${totalIframes} YouTube iframe(s)`
    )
    if (totalRowFailures > 0) {
      logger.error(`${totalRowFailures} row PUT(s) failed`)
    }
  } else {
    logger.info(
      `Would update ${totalRows} rows · would rewrite ${totalIframes} YouTube iframe(s) (run with --apply)`
    )
  }

  logger.divider()

  if (totalRowFailures > 0 && opts.apply) {
    throw new Error(
      `fix-youtube-iframes: ${totalRowFailures} row write failure(s)`
    )
  }
}

async function fetchAll(
  env: MigrationEnv,
  logger: Logger,
  status: "draft" | "published",
  limit: number | undefined
): Promise<V5Row[]> {
  const out: V5Row[] = []
  const pageSize = 100
  let page = 1

  while (true) {
    const params = qs.stringify(
      {
        fields: ["content", "slug"],
        status,
        locale: "en",
        pagination: { page, pageSize },
      },
      { encodeValuesOnly: true }
    )
    const url = `${env.target.baseUrl}/api/${ENDPOINT}?${params}`
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

async function putContent(
  env: MigrationEnv,
  documentId: string,
  status: "draft" | "published",
  content: string
): Promise<void> {
  const url = `${env.target.baseUrl}/api/${ENDPOINT}/${documentId}?status=${status}`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { content } }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${res.status} ${res.statusText} - ${body.slice(0, 300)}`)
  }
}
