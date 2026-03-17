import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const STATE_DIR = path.join(import.meta.dirname, "../../state")
const ID_MAP_FILE = path.join(STATE_DIR, "id-map.json")

type IdMapData = Record<string, Record<number, string>>

export class IdMap {
  private data: IdMapData = {}

  set(contentType: string, v4Id: number, v5DocumentId: string): void {
    if (!this.data[contentType]) {
      this.data[contentType] = {}
    }

    this.data[contentType]![v4Id] = v5DocumentId
  }

  get(contentType: string, v4Id: number): string | undefined {
    return this.data[contentType]?.[v4Id]
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(ID_MAP_FILE, "utf8")
      this.data = JSON.parse(raw)
    } catch {
      this.data = {}
    }
  }

  async save(): Promise<void> {
    await mkdir(STATE_DIR, { recursive: true })
    await writeFile(ID_MAP_FILE, JSON.stringify(this.data, null, 2))
  }

  async reset(): Promise<void> {
    this.data = {}
    await this.save()
  }
}
