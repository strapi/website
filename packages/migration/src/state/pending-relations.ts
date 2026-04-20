import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const STATE_DIR = path.join(import.meta.dirname, "../../state")
const FILE = path.join(STATE_DIR, "pending-relations.json")

export interface PendingSink {
  readonly _blogPostV4Ids?: number[]
  readonly _categoryV4Id?: number
}

/**
 * v5 documentId → ordered list of blog.related-posts sinks that still need
 * their relations resolved in pass 2 (resolve-blog-relations). The order
 * corresponds to the sink order inside the v5 post's `sections`.
 */
type PendingRelationsData = Record<string, PendingSink[]>

export class PendingRelations {
  private data: PendingRelationsData = {}

  set(v5DocumentId: string, sinks: PendingSink[]): void {
    if (sinks.length === 0) {
      delete this.data[v5DocumentId]

      return
    }

    this.data[v5DocumentId] = sinks
  }

  get(v5DocumentId: string): PendingSink[] | undefined {
    return this.data[v5DocumentId]
  }

  entries(): [string, PendingSink[]][] {
    return Object.entries(this.data)
  }

  delete(v5DocumentId: string): void {
    delete this.data[v5DocumentId]
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(FILE, "utf8")
      this.data = JSON.parse(raw)
    } catch {
      this.data = {}
    }
  }

  async save(): Promise<void> {
    await mkdir(STATE_DIR, { recursive: true })
    await writeFile(FILE, JSON.stringify(this.data, null, 2))
  }

  async reset(): Promise<void> {
    this.data = {}
    await this.save()
  }
}

export function extractPendingSinks(sections: unknown): PendingSink[] {
  if (!Array.isArray(sections)) return []

  const sinks: PendingSink[] = []

  for (const s of sections) {
    if (!s || typeof s !== "object") continue
    const entry = s as Record<string, unknown>
    if (entry["__component"] !== "migration.data-sink") continue
    if (entry["sourceComponent"] !== "blog.related-posts") continue

    const data = (entry["data"] as Record<string, unknown> | undefined) ?? {}
    const marker: { _blogPostV4Ids?: number[]; _categoryV4Id?: number } = {}

    if (Array.isArray(data["_blogPostV4Ids"])) {
      marker._blogPostV4Ids = (data["_blogPostV4Ids"] as unknown[]).filter(
        (n): n is number => typeof n === "number"
      )
    }

    if (typeof data["_categoryV4Id"] === "number") {
      marker._categoryV4Id = data["_categoryV4Id"] as number
    }

    sinks.push(marker)
  }

  return sinks
}
