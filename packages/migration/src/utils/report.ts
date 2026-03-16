import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { RunStats } from "../pipeline/runner.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORTS_DIR = path.join(__dirname, "../../reports")

export interface MigrationReport {
  timestamp: string
  entity: string
  dryRun: boolean
  duration: string
  summary: {
    totalEntities: number
    created: number
    updated: number
    skipped: number
    failed: number
    resumed: number
    totalComponentsMigrated: number
    totalComponentsSunk: number
  }
  componentCounts: Record<string, number>
  droppedComponents: Record<string, number>
  entityDetails: RunStats["entityDetails"]
}

export async function writeReport(
  entity: string,
  stats: RunStats,
  dryRun: boolean
): Promise<string> {
  await mkdir(REPORTS_DIR, { recursive: true })

  const now = new Date()
  const ts = now.toISOString().replaceAll(/[:.]/g, "-")
  const filename = `${entity}-${ts}.json`
  const filepath = path.join(REPORTS_DIR, filename)

  const details = stats.entityDetails

  const report: MigrationReport = {
    timestamp: now.toISOString(),
    entity,
    dryRun,
    duration: formatMs(stats.durationMs),
    summary: {
      totalEntities: details.length,
      created: details.filter((d) => d.action === "created").length,
      updated: details.filter((d) => d.action === "updated").length,
      skipped: details.filter((d) => d.action === "skipped").length,
      failed: details.filter((d) => d.action === "failed").length,
      resumed: details.filter((d) => d.action === "resumed").length,
      totalComponentsMigrated: Object.values(stats.componentCounts).reduce(
        (a, b) => a + b,
        0
      ),
      totalComponentsSunk: Object.values(stats.droppedComponents).reduce(
        (a, b) => a + b,
        0
      ),
    },
    componentCounts: sortByValue(stats.componentCounts),
    droppedComponents: sortByValue(stats.droppedComponents),
    entityDetails: details,
  }

  await writeFile(filepath, JSON.stringify(report, null, 2) + "\n")

  return filepath
}

function sortByValue(obj: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => b - a))
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60

  return `${minutes}m ${remaining}s`
}
