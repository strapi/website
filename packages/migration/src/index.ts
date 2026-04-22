import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import chalk from "chalk"
import { Command } from "commander"

import { auditSinks } from "./audit/audit-sinks.ts"
import { SourceClient } from "./clients/source.ts"
import { TargetClient } from "./clients/target.ts"
import { COMPONENT_MAP } from "./config/components.ts"
import { ENTITY_CONFIGS } from "./config/entities.ts"
import { loadEnv } from "./config/env.ts"
import { resolveBlogPostRelations } from "./entities/blog-post.ts"
import { setPageParents } from "./entities/page.ts"
import { prewarmIdMap, resolveDependencyUids } from "./pipeline/prewarm.ts"
import { runEntityMigration, type RunStats } from "./pipeline/runner.ts"
import { runFixPublishedAt } from "./scripts/fix-published-at.ts"
import { IdMap } from "./state/id-map.ts"
import { MediaCache } from "./state/media-cache.ts"
import {
  MigrationState,
  type EntityMigrationResult,
} from "./state/migration-state.ts"
import { PendingRelations } from "./state/pending-relations.ts"
import { createTransformContext } from "./transforms/base.ts"
import { createLogger, formatDuration } from "./utils/logger.ts"
import { writeReport } from "./utils/report.ts"

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
  .option("--no-resume", "Ignore resume state, re-process all entities")
  .option("--no-prewarm", "Skip prewarming IdMap from live v4+v5 APIs")
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

    const ctx = createTransformContext({
      env,
      idMap,
      logger,
      dryRun: opts.dryRun ?? false,
      force: opts.force ?? false,
      slugFilter: opts.slug,
      limit: opts.limit,
      noResume: opts.resume === false,
    })

    const flags = [
      opts.dryRun && "dry-run",
      opts.force && "force",
      opts.resume === false && "no-resume",
      opts.prewarm === false && "no-prewarm",
      opts.slug && `slug=${opts.slug}`,
      opts.limit && `limit=${opts.limit}`,
    ].filter(Boolean)

    logger.header(
      `Migrating: ${entity}${flags.length > 0 ? ` (${flags.join(", ")})` : ""}`
    )

    if (opts.prewarm !== false && config.dependencies?.length) {
      const depUids = resolveDependencyUids(ENTITY_CONFIGS, config.dependencies)
      logger.info(
        chalk.gray(
          `Prewarming IdMap for dependencies: ${config.dependencies.join(", ")}`
        )
      )
      const warmed = await prewarmIdMap(
        { env, idMap, logger },
        Object.values(ENTITY_CONFIGS),
        { only: depUids }
      )
      logger.info(
        chalk.gray(
          `IdMap prewarmed: ${warmed.prewarmed} types · ${warmed.matched} matched · ${warmed.unmatched} unmatched`
        )
      )
    }

    const result = await runEntityMigration(config, ctx, entity)
    printEntitySummary(entity, result, result.stats, logger)

    const reportPath = await writeReport(
      entity,
      result.stats,
      opts.dryRun ?? false
    )
    logger.info(chalk.gray(`Report: ${reportPath}`))

    if (result.failed > 0) {
      throw new Error(`Migration failed for ${entity}`)
    }
  })

program
  .command("run-all")
  .description("Run migration for all configured entity types")
  .option("--dry-run", "Log what would be written without making changes")
  .option("--exclude <entities>", "Comma-separated entity names to skip")
  .option(
    "--include <entities>",
    "Comma-separated entity names to run (only these)"
  )
  .option("--force", "Overwrite existing entries (bypass dedup)")
  .option("--no-resume", "Ignore resume state, re-process all entities")
  .option("--no-prewarm", "Skip prewarming IdMap from live v4+v5 APIs")
  .option("--verbose", "Debug-level logging")
  .action(async (opts) => {
    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const idMap = new IdMap()

    const excludeSet = new Set(
      opts.exclude
        ? (opts.exclude as string).split(",").map((s: string) => s.trim())
        : []
    )

    const includeSet = new Set(
      opts.include
        ? (opts.include as string).split(",").map((s: string) => s.trim())
        : []
    )

    const entries = Object.entries(ENTITY_CONFIGS).filter(([name]) => {
      if (includeSet.size > 0) return includeSet.has(name)

      return !excludeSet.has(name)
    })

    if (includeSet.size > 0) {
      logger.info(`Including only: ${[...includeSet].join(", ")}`)
    } else if (excludeSet.size > 0) {
      logger.info(`Excluding: ${[...excludeSet].join(", ")}`)
    }

    const totalStart = Date.now()
    const allStats: RunStats = {
      componentCounts: {},
      droppedComponents: {},
      entityDetails: [],
      durationMs: 0,
    }

    for (const [name, config] of entries) {
      const ctx = createTransformContext({
        env,
        idMap,
        logger,
        dryRun: opts.dryRun ?? false,
        force: opts.force ?? false,
        noResume: opts.resume === false,
      })

      if (opts.prewarm !== false && config.dependencies?.length) {
        const depUids = resolveDependencyUids(
          ENTITY_CONFIGS,
          config.dependencies
        )
        logger.info(
          chalk.gray(
            `Prewarming IdMap for ${name} deps: ${config.dependencies.join(", ")}`
          )
        )
        await prewarmIdMap(
          { env, idMap, logger },
          Object.values(ENTITY_CONFIGS),
          { only: depUids }
        )
      }

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
    if (entries.length > 1) {
      logger.header("Grand Total")
      printComponentStats(allStats, logger)
      logger.info(
        chalk.gray(`Total time: ${formatDuration(allStats.durationMs)}`)
      )
    }

    const reportPath = await writeReport("all", allStats, opts.dryRun ?? false)
    logger.info(chalk.gray(`Report: ${reportPath}`))
  })

program
  .command("set-parents")
  .description(
    "Set parent relations for migrated pages (run after all pages are migrated)"
  )
  .option("--dry-run", "Log what would be updated without making changes")
  .option("--no-prewarm", "Skip prewarming IdMap from live v4+v5 APIs")
  .option("--verbose", "Debug-level logging")
  .action(async (opts) => {
    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const idMap = new IdMap()
    const mediaCache = new MediaCache()
    await mediaCache.load()

    const ctx = {
      ...createTransformContext({
        env,
        idMap,
        logger,
        dryRun: opts.dryRun ?? false,
        force: false,
      }),
      sourceClient: new SourceClient({ env, logger }),
      targetClient: new TargetClient({ env, logger }),
      componentMap: COMPONENT_MAP,
      mediaCache,
    }

    if (opts.prewarm !== false) {
      const pageConfigs = Object.entries(ENTITY_CONFIGS)
        .filter(([name]) => name.startsWith("page-") || name === "pages")
        .map(([, cfg]) => cfg)
      if (pageConfigs.length > 0) {
        logger.info(chalk.gray(`Prewarming IdMap for page content types`))
        await prewarmIdMap({ env, idMap, logger }, pageConfigs)
      }
    }

    logger.header("Setting page parent relations")

    const result = await setPageParents(ctx)

    logger.info(
      chalk.green(`Updated ${result.updated} pages with parent relations`)
    )

    if (result.unresolved.length > 0) {
      console.log()
      logger.warn(chalk.bold(`${result.unresolved.length} unresolved parents:`))

      for (const msg of result.unresolved) {
        logger.warn(`  ${msg}`)
      }
    }
  })

program
  .command("resolve-blog-relations")
  .description(
    "Resolve deferred blog-post → blog-post relations in blog.related-posts sections (run after all blog-posts are migrated)"
  )
  .option("--dry-run", "Log what would be updated without making changes")
  .option("--no-prewarm", "Skip prewarming IdMap from live v4+v5 APIs")
  .option("--verbose", "Debug-level logging")
  .action(async (opts) => {
    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const idMap = new IdMap()
    const mediaCache = new MediaCache()
    await mediaCache.load()
    const pendingRelations = new PendingRelations()
    await pendingRelations.load()

    const ctx = {
      ...createTransformContext({
        env,
        idMap,
        logger,
        dryRun: opts.dryRun ?? false,
        force: false,
      }),
      sourceClient: new SourceClient({ env, logger }),
      targetClient: new TargetClient({ env, logger }),
      componentMap: COMPONENT_MAP,
      mediaCache,
      pendingRelations,
    }

    if (opts.prewarm !== false) {
      const blogPostConfig = ENTITY_CONFIGS["blog-posts"]
      if (blogPostConfig) {
        logger.info(chalk.gray(`Prewarming IdMap for blog-posts`))
        await prewarmIdMap({ env, idMap, logger }, [blogPostConfig])
      }
    }

    logger.header("Resolving blog-post related-posts relations")

    const result = await resolveBlogPostRelations(ctx)

    logger.info(
      chalk.green(
        `Updated ${result.updated} blog posts · skipped ${result.skipped}`
      )
    )

    if (result.unresolved.length > 0) {
      console.log()
      logger.warn(
        chalk.bold(`${result.unresolved.length} unresolved references:`)
      )

      for (const msg of result.unresolved) {
        logger.warn(`  ${msg}`)
      }
    }
  })

program
  .command("fix-published-at <entity>")
  .description(
    "Backfill originalPublishedAt on existing v5 entities using v4 publish dates"
  )
  .option("--dry-run", "Log matches without writing")
  .option("--slug <pattern>", "Filter by comma-separated slugs")
  .option("--limit <n>", "Max entries to patch", Number.parseInt)
  .option("--verbose", "Debug-level logging")
  .action(async (entity: string, opts) => {
    const config = ENTITY_CONFIGS[entity]

    if (!config) {
      throw new Error(
        `Unknown entity: ${entity}. Available: ${Object.keys(ENTITY_CONFIGS).join(", ")}`
      )
    }

    await runFixPublishedAt({
      entity,
      sourceEndpoint: config.sourceEndpoint,
      targetEndpoint: config.targetEndpoint,
      dryRun: opts.dryRun ?? false,
      slugFilter: opts.slug,
      limit: opts.limit,
      verbose: opts.verbose ?? false,
    })
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
    const mediaCache = new MediaCache()
    await mediaCache.reset()
    const pendingRelations = new PendingRelations()
    await pendingRelations.reset()
    console.log(
      "Migration state cleared. (IdMap is in-memory now — no file to reset.)"
    )
  })

program
  .command("audit-sinks")
  .description("Scan v5 entities for migration.data-sink components")
  .option("--verbose", "Debug-level logging")
  .option("--include <entities>", "Comma-separated entity names to scan")
  .action(async (opts) => {
    const env = loadEnv()
    const logger = createLogger(opts.verbose)
    const targetClient = new TargetClient({ env, logger })

    const include = opts.include
      ? (opts.include as string).split(",").map((s: string) => s.trim())
      : undefined

    logger.header("Data Sink Audit")

    const report = await auditSinks({
      targetClient,
      logger,
      include,
      verbose: opts.verbose,
    })

    // Console summary
    console.log()
    logger.info(
      `Scanned ${chalk.bold(String(report.totalEntitiesScanned))} entities across ${chalk.bold(String(Object.keys(report.byEntityType).length))} types`
    )

    // By source component
    const componentEntries = Object.entries(report.bySourceComponent).sort(
      ([, a], [, b]) => b.count - a.count
    )

    if (componentEntries.length > 0) {
      console.log()
      logger.info(chalk.bold("By source component:"))

      for (const [comp, info] of componentEntries) {
        const entityTypes = [...new Set(info.entities.map((e) => e.type))].join(
          ", "
        )

        logger.warn(
          `  ${chalk.white(comp.padEnd(40))} ×${String(info.count).padStart(4)}  across ${info.entities.length} entities (${entityTypes})`
        )
      }
    }

    // By entity type
    const typeEntries = Object.entries(report.byEntityType).sort(
      ([, a], [, b]) => b.sinkCount - a.sinkCount
    )

    if (typeEntries.length > 0) {
      console.log()
      logger.info(chalk.bold("By entity type:"))

      for (const [type, info] of typeEntries) {
        if (info.sinkCount === 0) continue

        logger.info(
          `  ${chalk.white(type.padEnd(25))} ${String(info.totalEntities).padStart(4)} entities, ${chalk.yellow(String(info.entitiesWithSinks))} with sinks (${chalk.red(String(info.sinkCount))} total sinks)`
        )
      }
    }

    if (report.totalSinks === 0) {
      console.log()
      logger.success("No data sinks found!")
    }

    // Write JSON report
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const reportsDir = path.join(__dirname, "../../reports")
    await mkdir(reportsDir, { recursive: true })

    const ts = new Date().toISOString().replaceAll(/[:.]/g, "-")
    const reportPath = path.join(reportsDir, `audit-sinks-${ts}.json`)
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n")

    console.log()
    logger.info(chalk.gray(`Report: ${reportPath}`))
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
