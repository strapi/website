/**
 * One-time patch: set `permanent` to false on every Strapi redirect.
 *
 * The v4 source defaulted this field to true, and those values were copied
 * as-is. The site now honors the flag (true → 301). Leaving the migrated
 * rows as true would turn existing redirects into permanent 301s on deploy.
 *
 * Redirects use draft & publish and are not localized. The site reads the
 * published copy, so both the draft and the published version are updated.
 * A draft-only row is updated in place and is not published.
 *
 * Dry-run by default.
 */

import qs from "qs"

import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { createLogger, type Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

const ENDPOINT = "redirects"

interface RedirectRow {
  documentId: string
  source?: string | null
  destination?: string | null
  permanent?: boolean | null
}

interface RedirectList {
  data: RedirectRow[]
  meta: { pagination?: { page: number; pageSize: number; pageCount: number } }
}

export interface ResetRedirectPermanentOptions {
  apply: boolean
  verbose?: boolean
}

export async function runResetRedirectPermanent(
  opts: ResetRedirectPermanentOptions
): Promise<void> {
  const env = loadEnv()
  const logger = createLogger(opts.verbose ?? false)

  logger.header(
    `Reset redirect permanent flag${opts.apply ? "" : " (dry-run)"}`
  )

  let updated = 0
  let failures = 0

  // Draft first, then published. A published PUT re-publishes the draft, so
  // the draft must already be false or the published copy would be rewritten
  // back to true.
  for (const status of ["draft", "published"] as const) {
    const rows = await fetchPermanentRedirects(env, logger, status)
    logger.info(
      `status=${status}: ${rows.length} redirect(s) with permanent=true`
    )

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!
      const label = (row.source ?? row.documentId).padEnd(50)

      if (!opts.apply) {
        logger.progress(
          i + 1,
          rows.length,
          `DRY  ${label} would set permanent=false (status=${status})`
        )
        updated++
        continue
      }

      try {
        await withRetry(() => setPermanentFalse(env, row.documentId, status), {
          logger,
        })
        updated++
        logger.progress(
          i + 1,
          rows.length,
          `OK   ${label} permanent=false (status=${status})`
        )
      } catch (err) {
        failures++
        const msg = err instanceof Error ? err.message : String(err)
        logger.progress(i + 1, rows.length, `FAIL ${label} ${msg}`)
      }
    }
  }

  logger.divider()

  if (opts.apply) {
    logger.info(`Updated ${updated} redirect version(s)`)
    if (failures > 0) {
      logger.error(`${failures} PUT(s) failed`)
    }
  } else {
    logger.info(
      `Would update ${updated} redirect version(s) (run with --apply)`
    )
  }

  logger.divider()

  if (failures > 0 && opts.apply) {
    throw new Error(`reset-redirect-permanent: ${failures} write failure(s)`)
  }
}

async function fetchPermanentRedirects(
  env: MigrationEnv,
  logger: Logger,
  status: "draft" | "published"
): Promise<RedirectRow[]> {
  const out: RedirectRow[] = []
  const pageSize = 100
  let page = 1

  while (true) {
    const params = qs.stringify(
      {
        fields: ["source", "destination", "permanent"],
        filters: { permanent: { $eq: true } },
        status,
        pagination: { page, pageSize },
      },
      { encodeValuesOnly: true }
    )
    const url = `${env.target.baseUrl}/api/${ENDPOINT}?${params}`
    logger.debug(`v5 fetch: ${url}`)

    const res = await withRetry(() => getJson<RedirectList>(env, url), {
      logger,
    })

    out.push(...res.data)

    const pag = res.meta.pagination
    if (!pag || page >= pag.pageCount) break

    page++
  }

  return out
}

async function setPermanentFalse(
  env: MigrationEnv,
  documentId: string,
  status: "draft" | "published"
): Promise<void> {
  const url = `${env.target.baseUrl}/api/${ENDPOINT}/${documentId}?status=${status}`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { permanent: false } }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const error = new Error(
      `${res.status} ${res.statusText} - ${body.slice(0, 300)}`
    ) as Error & { status: number }
    error.status = res.status
    throw error
  }
}

async function getJson<T>(env: MigrationEnv, url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.target.token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const error = new Error(
      `v5 fetch ${res.status}: ${body.slice(0, 300)}`
    ) as Error & { status: number }
    error.status = res.status
    throw error
  }

  return (await res.json()) as T
}
