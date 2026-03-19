import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const STATE_DIR = path.join(import.meta.dirname, "../../state")
const CACHE_FILE = path.join(STATE_DIR, "media-cache.json")

export interface MediaCacheEntry {
  id: number
  hash: string
}

/** URL → { id, hash } — hash is used to verify the media still exists in v5 */
type CacheData = Record<string, MediaCacheEntry>

/**
 * Persistent cache mapping source CDN URLs to uploaded v5 media entries.
 * Stores both the numeric ID (for relations) and the file hash (for verification).
 * Prevents re-uploading the same image across migration runs.
 */
export class MediaCache {
  private data: CacheData = {}

  get(url: string): MediaCacheEntry | undefined {
    return this.data[url]
  }

  set(url: string, entry: MediaCacheEntry): void {
    this.data[url] = entry
  }

  get size(): number {
    return Object.keys(this.data).length
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(CACHE_FILE, "utf8")
      const parsed = JSON.parse(raw)

      // Migrate legacy format: { url: number } → { url: { id, hash } }
      const migrated: CacheData = {}

      for (const [url, value] of Object.entries(parsed)) {
        if (typeof value === "number") {
          migrated[url] = { id: value, hash: "" }
        } else if (
          value &&
          typeof value === "object" &&
          "id" in value &&
          "hash" in value
        ) {
          migrated[url] = value as MediaCacheEntry
        }
      }

      this.data = migrated
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
