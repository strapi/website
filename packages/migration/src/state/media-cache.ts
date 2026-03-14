import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const STATE_DIR = path.join(import.meta.dirname, "../../state")
const CACHE_FILE = path.join(STATE_DIR, "media-cache.json")

/** URL → v5 media ID */
type CacheData = Record<string, number>

/**
 * Persistent cache mapping source CDN URLs to uploaded v5 media IDs.
 * Prevents re-uploading the same image across migration runs.
 */
export class MediaCache {
  private data: CacheData = {}

  get(url: string): number | undefined {
    return this.data[url]
  }

  set(url: string, mediaId: number): void {
    this.data[url] = mediaId
  }

  get size(): number {
    return Object.keys(this.data).length
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(CACHE_FILE, "utf8")
      this.data = JSON.parse(raw)
    } catch {
      this.data = {}
    }
  }

  async save(): Promise<void> {
    await mkdir(STATE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(this.data, null, 2))
  }

  async reset(): Promise<void> {
    this.data = {}
    await this.save()
  }
}
