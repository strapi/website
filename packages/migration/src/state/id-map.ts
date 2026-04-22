type IdMapData = Record<string, Record<number, string>>

/**
 * In-memory mapping of (v4 contentType, v4 id) → v5 documentId.
 *
 * Populated at run start from live v4 + v5 APIs by `prewarmIdMap`, and kept in
 * sync during the run via `set()` calls in the pipeline. Not persisted to disk:
 * the prior JSON cache was a third source of truth that silently drifted from
 * reality (wipes, manual v5 edits, resume skips) and caused unresolved-relation
 * bugs. API is authoritative now.
 */
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

  clear(): void {
    this.data = {}
  }
}
