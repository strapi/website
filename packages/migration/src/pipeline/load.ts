import type { EntityMigrationConfig } from "../config/entities.ts"
import type { TransformContext } from "../transforms/base.ts"

export interface LoadResult {
  action: "created" | "updated" | "skipped"
  documentId: string
}

export async function loadEntity(
  entity: Record<string, unknown>,
  config: EntityMigrationConfig,
  ctx: TransformContext
): Promise<LoadResult> {
  const dedupValue = entity[config.dedupField]

  if (dedupValue == null) {
    ctx.logger.warn(
      `Entity missing dedup field "${config.dedupField}", creating without dedup check`
    )
    const created = await ctx.targetClient.create(config.targetEndpoint, entity)

    return { action: "created", documentId: created.documentId }
  }

  const existing = await ctx.targetClient.findByField(
    config.targetEndpoint,
    config.dedupField,
    dedupValue
  )

  if (existing && !ctx.force) {
    ctx.logger.debug(
      `Skipped (exists): ${config.dedupField}=${String(dedupValue)}`
    )

    return { action: "skipped", documentId: existing.documentId }
  }

  if (existing && ctx.force) {
    await ctx.targetClient.update(
      config.targetEndpoint,
      existing.documentId,
      entity
    )
    ctx.logger.debug(`Updated: ${config.dedupField}=${String(dedupValue)}`)

    return { action: "updated", documentId: existing.documentId }
  }

  const created = await ctx.targetClient.create(config.targetEndpoint, entity)
  ctx.logger.debug(
    `Created: ${config.dedupField}=${String(dedupValue)} → ${created.documentId}`
  )

  return { action: "created", documentId: created.documentId }
}
