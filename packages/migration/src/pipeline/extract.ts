import type { V4Entity } from "../clients/source.ts"
import type { EntityMigrationConfig } from "../config/entities.ts"
import type { TransformContext } from "../transforms/base.ts"

/**
 * Extract entity stubs (id + top-level attributes only, no deep populate).
 * Full data is fetched one-by-one in the runner to avoid overwhelming the API.
 */
export async function extractAll(
  config: EntityMigrationConfig,
  ctx: TransformContext
): Promise<V4Entity[]> {
  ctx.logger.info(`Extracting IDs from: ${config.sourceEndpoint}`)

  const entities = await ctx.sourceClient.fetchAll(config.sourceEndpoint, {
    slugFilter: ctx.slugFilter,
    limit: ctx.limit,
  })

  ctx.logger.info(`Found ${entities.length} entities to process`)

  return entities
}
