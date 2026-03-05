import chalk from "chalk"

import { extractAll } from "./extract.ts"
import { loadEntity } from "./load.ts"
import { runTransforms } from "./transform.ts"
import { SourceClient } from "../clients/source.ts"
import { TargetClient } from "../clients/target.ts"
import { COMPONENT_MAP, type ComponentMapping } from "../config/components.ts"
import type { EntityMigrationConfig } from "../config/entities.ts"
import { MediaCache } from "../state/media-cache.ts"
import {
  MigrationState,
  type EntityMigrationResult,
} from "../state/migration-state.ts"
import type { TransformContext } from "../transforms/base.ts"

interface DynamicZoneEntry {
  __component: string
  [key: string]: unknown
}

/** Stats collected across all entities in a single run */
export interface RunStats {
  componentCounts: Record<string, number>
  droppedComponents: Record<string, number>
  entityDetails: EntityDetail[]
  durationMs: number
}

interface EntityDetail {
  slug: string
  action: "created" | "updated" | "skipped" | "failed" | "dry-run" | "resumed"
  components: string[]
  droppedComponents: string[]
}

export async function runEntityMigration(
  config: EntityMigrationConfig,
  partialCtx: Omit<
    TransformContext,
    "sourceClient" | "targetClient" | "componentMap" | "mediaCache"
  >
): Promise<EntityMigrationResult & { stats: RunStats }> {
  const mediaCache = new MediaCache()
  await mediaCache.load()

  const ctx: TransformContext = {
    ...partialCtx,
    sourceClient: new SourceClient({
      env: partialCtx.env,
      logger: partialCtx.logger,
    }),
    targetClient: new TargetClient({
      env: partialCtx.env,
      logger: partialCtx.logger,
    }),
    componentMap: COMPONENT_MAP,
    mediaCache,
  }

  const migrationState = new MigrationState()
  await migrationState.load()

  const state = migrationState.getEntityState(config.sourceEndpoint)
  const stats: RunStats = {
    componentCounts: {},
    droppedComponents: {},
    entityDetails: [],
    durationMs: 0,
  }

  const startTime = Date.now()
  const entities = await extractAll(config, ctx)

  // Sort ascending by ID — v4 API may return descending, and resume logic relies on ascending order
  entities.sort((a, b) => a.id - b.id)

  state.total = entities.length

  let resumedCount = 0
  let processedIndex = 0

  for (const stub of entities) {
    const v4Id = stub.id
    const slug =
      (stub.attributes["slug"] as string) ??
      (stub.attributes["name"] as string) ??
      `id:${v4Id}`

    if (v4Id <= state.lastProcessedId) {
      resumedCount++
      stats.entityDetails.push({
        slug,
        action: "resumed",
        components: [],
        droppedComponents: [],
      })
      continue
    }

    processedIndex++

    let transformed: Record<string, unknown> | undefined

    try {
      // Fetch full entity data with deep populate (one-by-one to avoid API overload)
      const entity = await ctx.sourceClient.fetchOne(
        config.sourceEndpoint,
        v4Id,
        config.sourcePopulate
      )

      const flat: Record<string, unknown> = {
        ...entity.attributes,
        _v4Id: v4Id,
      }

      // Capture source dynamic zone components before transform
      // v4 uses "slices", v5 uses "content" — check both
      const sourceComponents = extractComponentNames(
        flat["slices"] ?? flat["content"]
      )

      transformed = await runTransforms(flat, config.transforms, ctx)

      // Capture target dynamic zone components after transform
      const targetComponents = extractComponentNames(transformed["content"])
      const droppedInEntity = sourceComponents.filter(
        (c) =>
          !targetComponents.some((t) =>
            isComponentMapped(c, t, ctx.componentMap)
          )
      )

      // Track component stats
      for (const comp of targetComponents) {
        stats.componentCounts[comp] = (stats.componentCounts[comp] ?? 0) + 1
      }

      for (const comp of droppedInEntity) {
        stats.droppedComponents[comp] = (stats.droppedComponents[comp] ?? 0) + 1
      }

      if (ctx.dryRun) {
        const componentsLabel = formatComponentList(
          targetComponents,
          droppedInEntity
        )
        ctx.logger.progress(
          processedIndex,
          entities.length - resumedCount,
          `${chalk.yellow("DRY")} ${chalk.white(slug)}${componentsLabel}`
        )

        stats.entityDetails.push({
          slug,
          action: "dry-run",
          components: targetComponents,
          droppedComponents: droppedInEntity,
        })
        state.migrated++
      } else {
        const result = await loadEntity(transformed, config, ctx)
        ctx.idMap.set(config.sourceUid, v4Id, result.documentId)

        const actionLabel = formatAction(result.action)
        const componentsLabel = formatComponentList(
          targetComponents,
          droppedInEntity
        )

        ctx.logger.progress(
          processedIndex,
          entities.length - resumedCount,
          `${actionLabel} ${chalk.white(slug)}${componentsLabel}`
        )

        stats.entityDetails.push({
          slug,
          action: result.action,
          components: targetComponents,
          droppedComponents: droppedInEntity,
        })

        if (result.action === "skipped") {
          state.skipped++
        } else {
          state.migrated++
        }
      }
    } catch (error) {
      state.failed++
      state.errors.push({
        v4Id,
        slug: slug !== `id:${v4Id}` ? slug : undefined,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })

      ctx.logger.progress(
        processedIndex,
        entities.length - resumedCount,
        `${chalk.red("FAIL")} ${chalk.white(slug)} — ${chalk.red(error instanceof Error ? error.message : String(error))}`
      )

      if (transformed) {
        ctx.logger.debug(
          `Failed payload for ${slug}:\n${JSON.stringify(transformed, null, 2).slice(0, 2000)}`
        )
      }

      stats.entityDetails.push({
        slug,
        action: "failed",
        components: [],
        droppedComponents: [],
      })
    }

    state.lastProcessedId = v4Id

    if ((state.migrated + state.skipped + state.failed) % 10 === 0) {
      migrationState.setEntityState(config.sourceEndpoint, state)
      await migrationState.save()
      await mediaCache.save()
    }
  }

  if (resumedCount > 0) {
    ctx.logger.info(
      chalk.gray(
        `Skipped ${resumedCount} already-processed entities (resuming)`
      )
    )
  }

  migrationState.setEntityState(config.sourceEndpoint, state)
  await migrationState.save()
  await mediaCache.save()

  stats.durationMs = Date.now() - startTime

  return { ...state, stats }
}

function extractComponentNames(field: unknown): string[] {
  if (!Array.isArray(field)) return []

  return (field as DynamicZoneEntry[])
    .map((entry) => entry.__component)
    .filter(Boolean)
}

function isComponentMapped(
  source: string,
  target: string,
  componentMap: ComponentMapping[]
): boolean {
  return componentMap.some((m) => m.source === source && m.target === target)
}

function formatAction(action: "created" | "updated" | "skipped"): string {
  switch (action) {
    case "created":
      return chalk.green("CREATE")
    case "updated":
      return chalk.blue("UPDATE")
    case "skipped":
      return chalk.gray("SKIP  ")
  }
}

function formatComponentList(components: string[], dropped: string[]): string {
  if (components.length === 0 && dropped.length === 0) return ""

  const parts: string[] = []

  if (components.length > 0) {
    const shortNames = components.map(shortComponent)
    parts.push(chalk.cyan(shortNames.join(", ")))
  }

  if (dropped.length > 0) {
    const shortNames = dropped.map(shortComponent)
    parts.push(chalk.gray.strikethrough(shortNames.join(", ")))
  }

  return chalk.gray(" → ") + parts.join(chalk.gray(" | "))
}

/** sections.section-header → section-header */
function shortComponent(uid: string): string {
  return uid.split(".").pop() ?? uid
}
