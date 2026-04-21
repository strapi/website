import qs from "qs"

import type { EntityMigrationConfig } from "../config/entities.ts"
import type { MigrationEnv } from "../config/env.ts"
import type { IdMap } from "../state/id-map.ts"
import type { Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

interface PrewarmContext {
  env: MigrationEnv
  idMap: IdMap
  logger: Logger
}

interface V4SourceResponse {
  data?: {
    id: number
    attributes?: Record<string, unknown>
    [k: string]: unknown
  }[]
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface V5TargetResponse {
  data: {
    documentId: string
    id: number
    [k: string]: unknown
  }[]
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

type V4SimpleEntity = { id: number; dedup: unknown }
type V5SimpleEntity = { documentId: string; dedup: unknown }

async function fetchJson<T>(
  url: string,
  token: string,
  ctx: PrewarmContext
): Promise<T> {
  return withRetry<T>(
    async () => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) {
        const err = new Error(
          `API error: ${res.status} ${res.statusText} (${url})`
        ) as Error & { status: number }
        err.status = res.status
        throw err
      }

      return (await res.json()) as T
    },
    { logger: ctx.logger }
  )
}

async function fetchAllV4(
  ctx: PrewarmContext,
  endpoint: string,
  dedupField: string
): Promise<V4SimpleEntity[]> {
  const out: V4SimpleEntity[] = []
  const pageSize = 100
  let page = 1

  while (true) {
    const params = {
      pagination: { page, pageSize },
      publicationState: "preview",
      locale: "en",
      fields: ["id", dedupField],
    }
    const url = `${ctx.env.source.baseUrl}/api/${endpoint}?${qs.stringify(params, { encodeValuesOnly: true })}`
    const res = await fetchJson<V4SourceResponse>(
      url,
      ctx.env.source.token,
      ctx
    )

    for (const row of res.data ?? []) {
      const dedup = row.attributes?.[dedupField] ?? row[dedupField]
      if (dedup != null) out.push({ id: row.id, dedup })
    }

    const pag = res.meta?.pagination
    if (!pag || page >= pag.pageCount) break
    page++
  }

  return out
}

async function fetchAllV4Flat(
  ctx: PrewarmContext,
  endpoint: string,
  dedupField: string
): Promise<V4SimpleEntity[]> {
  // users-permissions endpoint returns a flat array (no data/meta wrapper)
  const url = `${ctx.env.source.baseUrl}/api/${endpoint}?fields[0]=id&fields[1]=${encodeURIComponent(dedupField)}`
  const rows = await fetchJson<Record<string, unknown>[]>(
    url,
    ctx.env.source.token,
    ctx
  )

  return rows
    .filter((r) => typeof r["id"] === "number" && r[dedupField] != null)
    .map((r) => ({ id: r["id"] as number, dedup: r[dedupField] }))
}

async function fetchAllV5(
  ctx: PrewarmContext,
  endpoint: string,
  dedupField: string
): Promise<V5SimpleEntity[]> {
  const out: V5SimpleEntity[] = []
  const pageSize = 100
  let page = 1

  while (true) {
    const params = {
      pagination: { page, pageSize },
      status: "draft",
      locale: "en",
      fields: ["documentId", dedupField],
    }
    const url = `${ctx.env.target.baseUrl}/api/${endpoint}?${qs.stringify(params, { encodeValuesOnly: true })}`
    const res = await fetchJson<V5TargetResponse>(
      url,
      ctx.env.target.token,
      ctx
    )

    for (const row of res.data ?? []) {
      const dedup = row[dedupField]
      if (dedup != null) out.push({ documentId: row.documentId, dedup })
    }

    const pag = res.meta?.pagination
    if (!pag || page >= pag.pageCount) break
    page++
  }

  return out
}

async function fetchAllV5Flat(
  ctx: PrewarmContext,
  endpoint: string,
  dedupField: string
): Promise<V5SimpleEntity[]> {
  const url = `${ctx.env.target.baseUrl}/api/${endpoint}?fields[0]=documentId&fields[1]=${encodeURIComponent(dedupField)}`
  const rows = await fetchJson<Record<string, unknown>[]>(
    url,
    ctx.env.target.token,
    ctx
  )

  return rows
    .filter((r) => typeof r["documentId"] === "string" && r[dedupField] != null)
    .map((r) => ({
      documentId: r["documentId"] as string,
      dedup: r[dedupField],
    }))
}

/**
 * Populate IdMap from live v4 + v5 APIs by joining on dedupField.
 *
 * For each config, lists v4 (id, dedupField) and v5 (documentId, dedupField),
 * matches them by dedupField, and writes v4Id → v5DocId into IdMap. This
 * replaces the old JSON-persisted IdMap, making runs resilient to resume/dry-run
 * skips and to out-of-band v5 edits.
 *
 * Skips configs that are single types (no per-row IdMap needed).
 */
export async function prewarmIdMap(
  ctx: PrewarmContext,
  configs: EntityMigrationConfig[],
  opts?: { only?: readonly string[] }
): Promise<{ prewarmed: number; matched: number; unmatched: number }> {
  const wanted = new Set(opts?.only)

  let totalMatched = 0
  let totalUnmatched = 0
  let prewarmed = 0

  for (const config of configs) {
    if (config.singleType || config.targetSingleType) continue
    if (wanted.size > 0 && !wanted.has(config.sourceUid)) continue

    const isUsers = config.sourceUid === "plugin::users-permissions.user"

    try {
      const [v4Entries, v5Entries] = await Promise.all([
        isUsers
          ? fetchAllV4Flat(ctx, config.sourceEndpoint, config.dedupField)
          : fetchAllV4(ctx, config.sourceEndpoint, config.dedupField),
        isUsers
          ? fetchAllV5Flat(ctx, config.targetEndpoint, config.dedupField)
          : fetchAllV5(ctx, config.targetEndpoint, config.dedupField),
      ])

      // v5 lookup table: dedup-value → documentId
      // `post-sub-categories` and `post-categories` share a target endpoint;
      // calling prewarm for both populates their (distinct) sourceUids from
      // the same v5 result set — correct, because slug is unique there.
      const v5Index = new Map<string, string>()
      for (const e of v5Entries) {
        v5Index.set(String(e.dedup), e.documentId)
      }

      let matched = 0
      let unmatched = 0
      for (const v4 of v4Entries) {
        const docId = v5Index.get(String(v4.dedup))
        if (docId) {
          ctx.idMap.set(config.sourceUid, v4.id, docId)
          matched++
        } else {
          unmatched++
        }
      }

      prewarmed++
      totalMatched += matched
      totalUnmatched += unmatched

      ctx.logger.debug(
        `Prewarmed ${config.sourceUid}: ${matched} matched, ${unmatched} unmatched (v4=${v4Entries.length}, v5=${v5Entries.length})`
      )
    } catch (e: unknown) {
      ctx.logger.warn(
        `Prewarm failed for ${config.sourceUid}: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }

  return { prewarmed, matched: totalMatched, unmatched: totalUnmatched }
}

/**
 * Resolve a config's dependency list into the corresponding sourceUids, so
 * prewarm can be scoped to only upstream types for a single-entity run.
 */
export function resolveDependencyUids(
  configs: Record<string, EntityMigrationConfig>,
  dependencyNames: readonly string[]
): string[] {
  const uids: string[] = []
  for (const name of dependencyNames) {
    const cfg = configs[name]
    if (cfg) uids.push(cfg.sourceUid)
  }

  return uids
}
