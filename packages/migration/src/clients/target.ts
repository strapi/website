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
   * Returns the media entity ID on success, or undefined if the upload fails.
   */
  async uploadMedia(
    sourceUrl: string,
    fileName?: string
  ): Promise<number | undefined> {
    try {
      // Download the image
      const imageRes = await fetch(sourceUrl)

      if (!imageRes.ok) {
        this.logger.warn(
          `Failed to download image: ${sourceUrl} (${imageRes.status})`
        )

        return undefined
      }

      const contentType = imageRes.headers.get("content-type") ?? "image/jpeg"
      const blob = await imageRes.blob()

      // Derive filename from URL or use provided name
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
          `Failed to upload media: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`
        )

        return undefined
      }

      const data = (await res.json()) as { id: number }[]

      return data[0]?.id
    } catch (error) {
      this.logger.warn(
        `Media upload error for ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`
      )

      return undefined
    }
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
        `Target API error: ${res.status} ${res.statusText} - ${body.slice(0, 200)}`
      ) as Error & { status: number }
      error.status = res.status
      throw error
    }

    return res.json() as Promise<T>
  }
}
