import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const STATE_DIR = path.join(import.meta.dirname, "../../state")
const STATE_FILE = path.join(STATE_DIR, "migration-state.json")

export interface MigrationError {
  v4Id: number
  slug?: string
  error: string
  timestamp: string
}

export interface EntityMigrationResult {
  total: number
  migrated: number
  skipped: number
  failed: number
  lastProcessedId: number
  errors: MigrationError[]
}

interface StateData {
  entities: Record<string, EntityMigrationResult>
  lastRun: string
}

export class MigrationState {
  private data: StateData = { entities: {}, lastRun: "" }

  async load(): Promise<void> {
    try {
      const raw = await readFile(STATE_FILE, "utf8")
      this.data = JSON.parse(raw)
    } catch {
      this.data = { entities: {}, lastRun: "" }
    }
  }

  getEntityState(entity: string): EntityMigrationResult {
    return (
      this.data.entities[entity] ?? {
        total: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        lastProcessedId: 0,
        errors: [],
      }
    )
  }

  setEntityState(entity: string, state: EntityMigrationResult): void {
    this.data.entities[entity] = state
    this.data.lastRun = new Date().toISOString()
  }

  async save(): Promise<void> {
    await mkdir(STATE_DIR, { recursive: true })
    await writeFile(STATE_FILE, JSON.stringify(this.data, null, 2))
  }

  async reset(): Promise<void> {
    this.data = { entities: {}, lastRun: "" }
    await this.save()
  }

  printSummary(): void {
    if (Object.keys(this.data.entities).length === 0) {
      console.log("No migration state found.")

      return
    }

    console.log(`Last run: ${this.data.lastRun}\n`)

    for (const [name, state] of Object.entries(this.data.entities)) {
      console.log(`${name}:`)
      console.log(`  Total: ${state.total}`)
      console.log(`  Migrated: ${state.migrated}`)
      console.log(`  Skipped: ${state.skipped}`)
      console.log(`  Failed: ${state.failed}`)

      if (state.errors.length > 0) {
        console.log(`  Errors: ${state.errors.length}`)
      }

      console.log()
    }
  }
}
