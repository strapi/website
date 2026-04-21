import qs from "qs"

import type { MigrationEnv } from "../config/env.ts"
import type { Logger } from "../utils/logger.ts"
import { withRetry } from "../utils/retry.ts"

export interface V4Entity {
  id: number
  attributes: Record<string, unknown> & {
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    locale?: string
  }
}

export interface V4Response {
  data: V4Entity | V4Entity[]
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface SourceClientOptions {
  env: MigrationEnv
  logger: Logger
}

export class SourceClient {
  private baseUrl: string
  private token: string
  private logger: Logger

  constructor(opts: SourceClientOptions) {
    this.baseUrl = opts.env.source.baseUrl
    this.token = opts.env.source.token
    this.logger = opts.logger
  }

  /**
   * Fetch all entities with lightweight pagination (no deep populate).
   * Returns entities with only top-level attributes for ID + dedup field.
   */
  async fetchAll(
    endpoint: string,
    opts?: { slugFilter?: string; limit?: number }
  ): Promise<V4Entity[]> {
    const entities: V4Entity[] = []
    let page = 1
    const pageSize = 100 // Safe without deep populate

    while (true) {
      const params: Record<string, unknown> = {
        pagination: { page, pageSize },
        publicationState: "preview", // include drafts
        locale: "en",
        sort: "id:asc",
      }

      if (opts?.slugFilter) {
        const slugs = opts.slugFilter
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)

        params["filters"] =
          slugs.length > 1
            ? { slug: { $in: slugs } }
            : { slug: { $eq: slugs[0] } }
      }

      const query = qs.stringify(params, { encodeValuesOnly: true })
      const url = `${this.baseUrl}/api/${endpoint}?${query}`

      this.logger.debug(`Fetching page ${page}: ${url}`)

      const response = await withRetry(() => this.request<V4Response>(url), {
        logger: this.logger,
      })

      const data = Array.isArray(response.data)
        ? response.data
        : [response.data]
      entities.push(...data)

      const pagination = response.meta.pagination
      if (!pagination || page >= pagination.pageCount) break

      if (opts?.limit && entities.length >= opts.limit) {
        return entities.slice(0, opts.limit)
      }

      page++
    }

    return opts?.limit ? entities.slice(0, opts.limit) : entities
  }

  /**
   * Fetch a single entity by ID with full populate.
   * Used after fetchAll to get complete data one-by-one.
   */
  async fetchOne(
    endpoint: string,
    id: number,
    populate: Record<string, unknown> | string = "*"
  ): Promise<V4Entity> {
    const params: Record<string, unknown> = {
      populate,
      publicationState: "preview",
      locale: "en",
    }

    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/${endpoint}/${id}?${query}`

    this.logger.debug(`Fetching entity: ${url}`)

    const response = await withRetry(() => this.request<V4Response>(url), {
      logger: this.logger,
    })

    const entity = Array.isArray(response.data)
      ? response.data[0]
      : response.data

    if (!entity) {
      throw new Error(`Entity not found: ${endpoint}/${id}`)
    }

    return entity
  }

  /**
   * Fetch a single type entity with full populate.
   * Single types don't support /{id} URLs — uses /api/{endpoint} directly.
   */
  async fetchSingleType(
    endpoint: string,
    populate: Record<string, unknown> | string = "*"
  ): Promise<V4Entity> {
    const params: Record<string, unknown> = {
      populate,
      publicationState: "preview",
      locale: "en",
    }

    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/${endpoint}?${query}`

    this.logger.debug(`Fetching single type: ${url}`)

    const response = await withRetry(() => this.request<V4Response>(url), {
      logger: this.logger,
    })

    const entity = Array.isArray(response.data)
      ? response.data[0]
      : response.data

    if (!entity) {
      throw new Error(`Single type not found: ${endpoint}`)
    }

    return entity
  }

  /**
   * Fetch all users-permissions users (flat array format, no content API wrapper).
   */
  async fetchUsers(populate?: string): Promise<V4Entity[]> {
    const params: Record<string, unknown> = {}
    if (populate) params["populate"] = populate

    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/users?${query}`

    this.logger.debug(`Fetching users: ${url}`)

    const users = await withRetry(
      () => this.request<Record<string, unknown>[]>(url),
      { logger: this.logger }
    )

    return users.map((user) => {
      const { id, ...attributes } = user

      return {
        id: id as number,
        attributes: {
          ...attributes,
          createdAt:
            (attributes["createdAt"] as string) ?? new Date().toISOString(),
          updatedAt:
            (attributes["updatedAt"] as string) ?? new Date().toISOString(),
          publishedAt: null,
        },
      } as V4Entity
    })
  }

  /**
   * Fetch a single users-permissions user by ID (flat object format).
   */
  async fetchUser(id: number, populate?: string): Promise<V4Entity> {
    const params: Record<string, unknown> = {}
    if (populate) params["populate"] = populate

    const query = qs.stringify(params, { encodeValuesOnly: true })
    const url = `${this.baseUrl}/api/users/${id}?${query}`

    this.logger.debug(`Fetching user: ${url}`)

    const user = await withRetry(
      () => this.request<Record<string, unknown>>(url),
      { logger: this.logger }
    )

    const { id: userId, ...attributes } = user

    return {
      id: userId as number,
      attributes: {
        ...attributes,
        createdAt:
          (attributes["createdAt"] as string) ?? new Date().toISOString(),
        updatedAt:
          (attributes["updatedAt"] as string) ?? new Date().toISOString(),
        publishedAt: null,
      },
    } as V4Entity
  }

  private async request<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const error = new Error(
        `Source API error: ${res.status} ${res.statusText}`
      ) as Error & { status: number }
      error.status = res.status
      throw error
    }

    return res.json() as Promise<T>
  }
}
