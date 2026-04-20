import type { SourceClient } from "../clients/source.ts"
import type { TargetClient } from "../clients/target.ts"
import type { ComponentMapping } from "../config/components.ts"
import type { MigrationEnv } from "../config/env.ts"
import type { IdMap } from "../state/id-map.ts"
import type { MediaCache } from "../state/media-cache.ts"
import type { PendingRelations } from "../state/pending-relations.ts"
import type { Logger } from "../utils/logger.ts"

export interface TransformContext {
  env: MigrationEnv
  sourceClient: SourceClient
  targetClient: TargetClient
  idMap: IdMap
  mediaCache: MediaCache
  pendingRelations?: PendingRelations
  logger: Logger
  componentMap: ComponentMapping[]
  dryRun: boolean
  force: boolean
  slugFilter?: string
  limit?: number
  noResume?: boolean
}

export type TransformFn = (
  entity: Record<string, unknown>,
  ctx: TransformContext
) => Promise<Record<string, unknown>> | Record<string, unknown>

export interface CreateContextOptions {
  env: MigrationEnv
  idMap: IdMap
  logger: Logger
  dryRun: boolean
  force: boolean
  slugFilter?: string
  limit?: number
  noResume?: boolean
}

export function createTransformContext(opts: CreateContextOptions): Omit<
  TransformContext,
  "sourceClient" | "targetClient" | "componentMap" | "mediaCache"
> & {
  env: MigrationEnv
  idMap: IdMap
  logger: Logger
  dryRun: boolean
  force: boolean
  slugFilter?: string
  limit?: number
} {
  return {
    env: opts.env,
    idMap: opts.idMap,
    logger: opts.logger,
    dryRun: opts.dryRun,
    force: opts.force,
    slugFilter: opts.slugFilter,
    limit: opts.limit,
    noResume: opts.noResume,
  }
}
