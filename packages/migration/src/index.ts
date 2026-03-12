import chalk from "chalk"
import { Command } from "commander"

import { ENTITY_CONFIGS } from "./config/entities.ts"
import { loadEnv } from "./config/env.ts"
import { runEntityMigration, type RunStats } from "./pipeline/runner.ts"
import { IdMap } from "./state/id-map.ts"
import {
  MigrationState,
  type EntityMigrationResult,
} from "./state/migration-state.ts"
import { createTransformContext } from "./transforms/base.ts"
import { createLogger, formatDuration } from "./utils/logger.ts"

const program = new Command()

program
  .name("migrate")
  .description("Migrate content from Strapi v4 to v5")
  .version("1.0.0")

program
  .command("run <entity>")
  .description("Run migration for a specific entity type")
  .option("--dry-run", "Log what would be written without making changes")
  .option("--slug <pattern>", "Filter by slug glob pattern")
  .option("--limit <n>", "Max entities to process", Number.parseInt)
  .option("--force", "Overwrite existing entries (bypass dedup)")
  .option("--verbose", "Debug-level logging")
  .action(async (entity: string, opts) => {
    const config = ENTITY_CONFIGS[entity]

    if (!config) {
      console.error(
        `Unknown entity: ${entity}. Available: ${Object.keys(ENTITY_CONFIGS).join(", ")}`
      )

      throw new Error(
        `Unknown entity: ${entity}. Available: ${Object.keys(ENTITY_CONFIGS).join(", ")}`
      )
    }

    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const idMap = new IdMap()
    await idMap.load()

    const ctx = createTransformContext({
      env,
      idMap,
      logger,
      dryRun: opts.dryRun ?? false,
      force: opts.force ?? false,
      slugFilter: opts.slug,
      limit: opts.limit,
    })

    const flags = [
      opts.dryRun && "dry-run",
      opts.force && "force",
      opts.slug && `slug=${opts.slug}`,
      opts.limit && `limit=${opts.limit}`,
    ].filter(Boolean)

    logger.header(
      `Migrating: ${entity}${flags.length > 0 ? ` (${flags.join(", ")})` : ""}`
    )

    const result = await runEntityMigration(config, ctx, entity)
    printEntitySummary(entity, result, result.stats, logger)

    await idMap.save()

    if (result.failed > 0) {
      throw new Error(`Migration failed for ${entity}`)
    }
  })

program
  .command("run-all")
  .description("Run migration for all configured entity types")
  .option("--dry-run", "Log what would be written without making changes")
  .option("--verbose", "Debug-level logging")
  .action(async (opts) => {
    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const idMap = new IdMap()
    await idMap.load()

    const totalStart = Date.now()
    const allStats: RunStats = {
      componentCounts: {},
      droppedComponents: {},
      entityDetails: [],
      durationMs: 0,
    }

    for (const [name, config] of Object.entries(ENTITY_CONFIGS)) {
      const ctx = createTransformContext({
        env,
        idMap,
        logger,
        dryRun: opts.dryRun ?? false,
        force: false,
      })

      logger.header(`Migrating: ${name}`)

      const result = await runEntityMigration(config, ctx, name)
      printEntitySummary(name, result, result.stats, logger)

      // Merge stats
      for (const [comp, count] of Object.entries(
        result.stats.componentCounts
      )) {
        allStats.componentCounts[comp] =
          (allStats.componentCounts[comp] ?? 0) + count
      }

      for (const [comp, count] of Object.entries(
        result.stats.droppedComponents
      )) {
        allStats.droppedComponents[comp] =
          (allStats.droppedComponents[comp] ?? 0) + count
      }

      allStats.entityDetails.push(...result.stats.entityDetails)
    }

    allStats.durationMs = Date.now() - totalStart

    // Grand summary
    if (Object.keys(ENTITY_CONFIGS).length > 1) {
      logger.header("Grand Total")
      printComponentStats(allStats, logger)
      logger.info(
        chalk.gray(`Total time: ${formatDuration(allStats.durationMs)}`)
      )
    }

    await idMap.save()
  })

program
  .command("status")
  .description("Show migration state")
  .action(async () => {
    const state = new MigrationState()
    await state.load()
    state.printSummary()
  })

program
  .command("reset")
  .description("Clear migration state for a fresh run")
  .action(async () => {
    const state = new MigrationState()
    await state.reset()
    const idMap = new IdMap()
    await idMap.reset()
    console.log("Migration state cleared.")
  })

program.parse()

// ─── Formatting helpers ───

function printEntitySummary(
  name: string,
  result: EntityMigrationResult,
  stats: RunStats,
  logger: ReturnType<typeof createLogger>
): void {
  console.log()
  logger.divider()

  const parts = [
    chalk.green(`${result.migrated} migrated`),
    result.skipped > 0 ? chalk.gray(`${result.skipped} skipped`) : null,
    result.failed > 0 ? chalk.red(`${result.failed} failed`) : null,
  ].filter(Boolean)

  logger.info(
    `${chalk.bold(name)}: ${parts.join(chalk.gray(" · "))} ${chalk.gray(`of ${result.total} total`)}`
  )

  // Component breakdown
  printComponentStats(stats, logger)

  // Errors
  if (result.errors.length > 0) {
    console.log()
    logger.warn(chalk.bold("Errors:"))

    for (const err of result.errors) {
      logger.error(
        `v4 id=${err.v4Id} slug=${chalk.white(err.slug ?? "?")} — ${err.error}`
      )
    }
  }

  logger.info(chalk.gray(`Completed in ${formatDuration(stats.durationMs)}`))
  logger.divider()
}

function printComponentStats(
  stats: RunStats,
  logger: ReturnType<typeof createLogger>
): void {
  const hasMigrated = Object.keys(stats.componentCounts).length > 0
  const hasDropped = Object.keys(stats.droppedComponents).length > 0

  if (!hasMigrated && !hasDropped) return

  if (hasMigrated) {
    console.log()
    logger.info(chalk.bold("Components migrated:"))

    const sorted = Object.entries(stats.componentCounts).sort(
      ([, a], [, b]) => b - a
    )

    for (const [comp, count] of sorted) {
      const short = comp.split(".").pop() ?? comp
      logger.success(
        `${chalk.white(short)} ${chalk.gray(`×${count}`)} ${chalk.gray(`(${comp})`)}`
      )
    }
  }

  if (hasDropped) {
    console.log()
    logger.warn(chalk.bold("Components dropped:"))

    const sorted = Object.entries(stats.droppedComponents).sort(
      ([, a], [, b]) => b - a
    )

    for (const [comp, count] of sorted) {
      const short = comp.split(".").pop() ?? comp
      logger.warn(
        `${chalk.strikethrough(short)} ${chalk.gray(`×${count}`)} ${chalk.gray(`(${comp})`)}`
      )
    }
  }
}
