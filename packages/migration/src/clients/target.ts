import qs from "qs"

import type { MigrationEnv } from "../config/env.ts"
import type { Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"
import { stripIds } from "../utils/strip-ids.ts"

export interface V5Entity {
  documentId: string
  id: number
  locale?: string
  publishedAt: string | null
  [key: string]: unknown
}

interface V5ListResponse {
  data: V5Entity[]
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface V5SingleResponse {
  data: V5Entity
}

export interface TargetClientOptions {
  env: MigrationEnv
  logger: Logger
}

export class TargetClient {
  private baseUrl: string
  private token: string
  private logger: Logger

  constructor(opts: TargetClientOptions) {
    this.baseUrl = opts.env.target.baseUrl
    this.token = opts.env.target.token
    this.logger = opts.logger
  }

  async findByField(
    endpoint: string,
    field: string,
    value: unknown,
    locale?: string
  ): Promise<V5Entity | undefined> {
    const params: Record<string, unknown> = {
      filters: { [field]: { $eq: value } },
      locale: locale ?? "en",
      status: "draft", // search all (drafts include published)
    }

    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/${endpoint}?${query}`

    this.logger.debug(`Dedup lookup: ${url}`)

    const response = await withRetry(() => this.request<V5ListResponse>(url), {
      logger: this.logger,
    })

    return response.data[0]
  }

  async create(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<V5Entity> {
    const url = `${this.baseUrl}/api/${endpoint}`
    const payload = { data: stripIds(data) }

    this.logger.debug(`Creating: ${endpoint}`)

    const response = await withRetry(
      () =>
        this.request<V5SingleResponse>(url, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { logger: this.logger }
    )

    return response.data
  }

  async update(
    endpoint: string,
    documentId: string,
    data: Record<string, unknown>
  ): Promise<V5Entity> {
    const url = `${this.baseUrl}/api/${endpoint}/${documentId}`
    const payload = { data: stripIds(data) }

    this.logger.debug(`Updating: ${endpoint}/${documentId}`)

    const response = await withRetry(
      () =>
        this.request<V5SingleResponse>(url, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      { logger: this.logger }
    )

    return response.data
  }

  /**
   * Download an image from a URL and upload it to the v5 media library.
   * Returns { id, hash } on success, or undefined if the upload fails.
   */
  async uploadMedia(
    sourceUrl: string,
    fileName?: string
  ): Promise<{ id: number; hash: string } | undefined> {
    try {
      const imageRes = await fetch(sourceUrl)

      if (!imageRes.ok) {
        this.logger.warn(
          `Failed to download image: ${sourceUrl} (${imageRes.status})`
        )

        return undefined
      }

      const contentType = imageRes.headers.get("content-type") ?? "image/jpeg"
      const blob = await imageRes.blob()

      const name =
        fileName ?? sourceUrl.split("/").pop()?.split("?")[0] ?? "image.jpg"

      const formData = new FormData()
      formData.append("files", new File([blob], name, { type: contentType }))

      const url = `${this.baseUrl}/api/upload`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        this.logger.warn(
          `Failed to upload media: ${res.status} ${res.statusText} - ${body.slice(0, 500)}`
        )

        return undefined
      }

      const data = (await res.json()) as { id: number; hash: string }[]
      const entry = data[0]

      if (!entry) return undefined

      return { id: entry.id, hash: entry.hash }
    } catch (error) {
      this.logger.warn(
        `Media upload error for ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`
      )

      return undefined
    }
  }

  /**
   * Verify a cached media entry still exists in v5 and matches the expected hash.
   * Returns true if valid, false if stale/missing.
   */
  async verifyMedia(id: number, expectedHash: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/upload/files/${id}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.token}` },
      })

      if (!res.ok) return false

      const data = (await res.json()) as { id: number; hash: string }

      return data.hash === expectedHash
    } catch {
      return false
    }
  }

  /**
   * Create a users-permissions user (flat payload, no { data } wrapper).
   */
  async createUser(data: Record<string, unknown>): Promise<V5Entity> {
    const url = `${this.baseUrl}/api/users`

    this.logger.debug(`Creating user: ${data["email"]}`)

    return withRetry(
      () =>
        this.request<V5Entity>(url, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      { logger: this.logger }
    )
  }

  /**
   * Update a users-permissions user by numeric ID (flat payload).
   */
  async updateUser(
    id: number,
    data: Record<string, unknown>
  ): Promise<V5Entity> {
    const url = `${this.baseUrl}/api/users/${id}`

    this.logger.debug(`Updating user: ${id}`)

    return withRetry(
      () =>
        this.request<V5Entity>(url, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      { logger: this.logger }
    )
  }

  /**
   * Find a users-permissions user by field (flat array response).
   */
  async findUserByField(
    field: string,
    value: unknown
  ): Promise<V5Entity | undefined> {
    const params = { filters: { [field]: { $eq: value } } }
    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/users?${query}`

    this.logger.debug(`Finding user by ${field}: ${url}`)

    const response = await withRetry(() => this.request<V5Entity[]>(url), {
      logger: this.logger,
    })

    return response[0]
  }

  async updateSingleType(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<V5Entity> {
    const url = `${this.baseUrl}/api/${endpoint}`
    const payload = { data: stripIds(data) }

    this.logger.debug(`Updating single type: ${endpoint}`)

    const response = await withRetry(
      () =>
        this.request<V5SingleResponse>(url, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      { logger: this.logger }
    )

    return response.data
  }

  async list(
    endpoint: string,
    populate: Record<string, unknown> = {}
  ): Promise<V5Entity[]> {
    const all: V5Entity[] = []
    let page = 1

    while (true) {
      const params: Record<string, unknown> = {
        populate,
        pagination: { pageSize: 100, page },
        status: "draft",
        locale: "en",
      }

      const query = qs.stringify(params, { encodeValuesOnly: true })
      const url = `${this.baseUrl}/api/${endpoint}?${query}`

      this.logger.debug(`List ${endpoint} page ${page}: ${url}`)

      const response = await withRetry(
        () => this.request<V5ListResponse>(url),
        { logger: this.logger }
      )

      all.push(...response.data)

      const pagination = response.meta.pagination
      if (!pagination || page >= pagination.pageCount) break

      page++
    }

    return all
  }

  async publish(endpoint: string, documentId: string): Promise<void> {
    const url = `${this.baseUrl}/api/${endpoint}/${documentId}`

    await withRetry(
      () =>
        this.request(url, {
          method: "PUT",
          body: JSON.stringify({
            data: { publishedAt: new Date().toISOString() },
          }),
        }),
      { logger: this.logger }
    )
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      const error = new Error(
        `Target API error: ${res.status} ${res.statusText} - ${body.slice(0, 500)}`
      ) as Error & { status: number }
      error.status = res.status
      throw error
    }

    return res.json() as Promise<T>
  }
}
