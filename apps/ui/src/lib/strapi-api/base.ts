import type { FindFirst, FindMany, ID, Result, UID } from "@repo/strapi-types"

import { getEnvVar } from "@/lib/env-vars"
import { isDevelopment } from "@/lib/general-helpers"
import { PAGE_REVALIDATE_SECONDS } from "@/lib/revalidate"
import type {
  APIResponse,
  APIResponseCollection,
  APIResponseWithBreadcrumbs,
  AppLocalizedParams,
  DynamicZonePopulateParams,
  PageLocalization,
} from "@/types/api"
import type { AppError, CustomFetchOptions } from "@/types/general"

// Add endpoints here that are queried from the frontend.
// Mapping of Strapi content type UIDs to API endpoint paths.
export const API_ENDPOINTS: Partial<Record<UID.ContentType, string>> = {
  "api::page.page": "/pages",
  "api::blog-post.blog-post": "/blog-posts",
  "api::post-tag.post-tag": "/post-tags",
  "api::post-category.post-category": "/post-categories",
  "api::blog.blog": "/blog",
  "api::footer.footer": "/footer",
  "api::header.header": "/header",
  "api::cms.cms": "/cmses",
  "api::cms-comparison.cms-comparison": "/cms-comparisons",
  "api::case-study.case-study": "/case-studies",
  "api::global.global": "/global",
  "api::not-found.not-found": "/not-found",
  "api::news-item.news-item": "/news-items",
  "api::redirect.redirect": "/redirects",
} as const

/**
 * Content types with Strapi i18n enabled (`pluginOptions.i18n.localized: true`
 * in their schema). ONLY these accept a `locale` query param / `locale` field —
 * sending `locale` to any other content type returns a 400 "Invalid key locale"
 * and can break build-time static generation. Keep in sync with the Strapi
 * schemas (`apps/strapi/src/api/<type>/content-types/<type>/schema.json`).
 */
const LOCALIZED_UIDS = new Set<UID.ContentType>([
  "api::page.page",
  "api::blog.blog",
  "api::blog-category.blog-category",
  "api::blog-tag.blog-tag",
  "api::footer.footer",
  "api::header.header",
  "api::not-found.not-found",
  "api::plan.plan",
])

/**
 * For non-localized content types, drop `locale` from both the query params and
 * any `locale` field selection, and flag the request so the client doesn't
 * re-add the locale param. Localized types are returned untouched.
 */
function normalizeLocaleForUid<TParams>(
  uid: UID.ContentType,
  params: TParams | undefined,
  options?: CustomFetchOptions
): { params: TParams | undefined; options: CustomFetchOptions | undefined } {
  if (LOCALIZED_UIDS.has(uid) || params == null) {
    return { params, options }
  }

  const next: Record<string, unknown> = {
    ...(params as Record<string, unknown>),
  }
  delete next.locale

  if (Array.isArray(next.fields)) {
    next.fields = next.fields.filter((field) => field !== "locale")
  }

  return {
    params: next as TParams,
    options: { ...options, doNotAddLocaleQueryParams: true },
  }
}

export default abstract class BaseStrapiClient {
  public async fetchAPI(
    path: string,
    params: AppLocalizedParams<Record<string, unknown>> = {},
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ) {
    const { url, headers } = await this.prepareRequest(
      path,
      {
        ...params,
        ...(options?.doNotAddLocaleQueryParams
          ? {}
          : { locale: params.locale }),
      },
      requestInit,
      options
    )

    // Caller-provided cache config wins. When the caller passes `cache: "no-store"`
    // (e.g. draft mode), Next.js treats `next.revalidate` as mutually exclusive,
    // so only forward `next.tags` in that case.
    const mergedHeaders = {
      ...requestInit?.headers,
      ...headers,
    }
    const fetchInit: RequestInit = requestInit?.cache
      ? {
          ...requestInit,
          ...(requestInit?.next?.tags
            ? { next: { tags: requestInit.next.tags } }
            : {}),
          headers: mergedHeaders,
        }
      : {
          ...requestInit,
          next: {
            tags: requestInit?.next?.tags,
            // if revalidate is set to a number since 0 implies cache: 'no-store' and a positive value implies cache: 'force-cache'.
            revalidate: isDevelopment()
              ? 0
              : (requestInit?.next?.revalidate ?? PAGE_REVALIDATE_SECONDS),
          },
          headers: mergedHeaders,
        }

    const response = await fetch(url, fetchInit)

    const { json, text } = await this.parseResponse(response)

    if (text) {
      const appError: AppError = {
        name: "Invalid response format",
        message: text,
        status: response.status,
        details: { url },
      }
      console.error("[BaseStrapiClient] Strapi API request error:", appError)
      throw new Error(JSON.stringify(appError))
    }

    if (!response.ok) {
      const { error } = json
      const appError: AppError = {
        name: error?.name,
        message: error?.message,
        details: {
          url,
        },
        status: response.status ?? error?.status,
      }
      if (getEnvVar("DEBUG_STRAPI_CLIENT_API_CALLS")) {
        console.error("[BaseStrapiClient] Strapi API request error:", appError)
      }
      throw new Error(JSON.stringify(appError))
    }

    return json
  }

  /**
   * Fetches one document by ID or Single type (without ID)
   */
  public async fetchOne<
    TContentTypeUID extends UID.ContentType,
    TParams extends AppLocalizedParams<FindFirst<TContentTypeUID>>,
  >(
    uid: TContentTypeUID,
    documentId?: ID | undefined,
    params?: TParams,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<
    APIResponse<Result<TContentTypeUID, DynamicZonePopulateParams<TParams>>>
  > {
    const path = this.getStrapiApiPathByUId(uid)
    const url = `${path}${documentId ? `/${documentId}` : ""}`
    const localized = normalizeLocaleForUid(uid, params, options)

    return this.fetchAPI(url, localized.params, requestInit, localized.options)
  }

  /**
   * Fetches multiple documents
   */
  public async fetchMany<
    TContentTypeUID extends UID.ContentType,
    TParams extends AppLocalizedParams<FindMany<TContentTypeUID>>,
  >(
    uid: TContentTypeUID,
    params?: TParams,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<
    APIResponseCollection<
      Result<TContentTypeUID, DynamicZonePopulateParams<TParams>>
    >
  > {
    const path = this.getStrapiApiPathByUId(uid)
    const localized = normalizeLocaleForUid(uid, params, options)

    return this.fetchAPI(path, localized.params, requestInit, localized.options)
  }

  /**
   * Fetches all documents
   */
  public async fetchAll<
    TContentTypeUID extends UID.ContentType,
    TParams extends AppLocalizedParams<FindMany<TContentTypeUID>>,
  >(
    uid: TContentTypeUID,
    params?: TParams,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<APIResponseCollection<Result<TContentTypeUID, TParams>>> {
    const path = this.getStrapiApiPathByUId(uid)
    const localized = normalizeLocaleForUid(uid, params, options)

    // Strapi can be configured in https://docs.strapi.io/dev-docs/configurations/api
    const maxPageSize = 100

    const firstPage: APIResponseCollection<Result<TContentTypeUID, TParams>> =
      await this.fetchAPI(
        path,
        { ...localized.params, pagination: { page: 1, pageSize: maxPageSize } },
        requestInit,
        localized.options
      )

    if (firstPage.meta.pagination.pageCount === 1) {
      return firstPage
    }

    const otherPages = Array.from(
      { length: firstPage.meta.pagination.pageCount - 1 },
      (_, i) =>
        this.fetchAPI(
          path,
          {
            ...localized.params,
            pagination: {
              ...firstPage.meta.pagination,
              page: i + 2,
              pageSize: maxPageSize,
            },
          },
          requestInit,
          localized.options
        )
    )

    return Promise.all(otherPages).then((res) => ({
      data: [firstPage.data, ...res.map((page) => page.data)].flat(),
      meta: {
        pagination: {
          page: 1,
          pageCount: 1,
          pageSize: firstPage.meta.pagination.total,
          total: firstPage.meta.pagination.total,
        },
      },
    }))
  }

  /**
   * Fetches a single entity by slug
   */
  public async fetchOneBySlug<
    TContentTypeUID extends UID.ContentType,
    TParams extends AppLocalizedParams<FindMany<TContentTypeUID>>,
  >(
    uid: TContentTypeUID,
    slug: string | null,
    params?: TParams,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<
    APIResponse<Result<TContentTypeUID, DynamicZonePopulateParams<TParams>>>
  > {
    const slugFilter = slug && slug.length > 0 ? { $eq: slug } : { $null: true }
    const localized = normalizeLocaleForUid(uid, params, options)
    const mergedParams = {
      ...localized.params,
      sort: { publishedAt: "desc" },
      filters: { ...localized.params?.filters, slug: slugFilter },
    }
    const path = this.getStrapiApiPathByUId(uid)
    const response: APIResponseCollection<
      Result<TContentTypeUID, DynamicZonePopulateParams<TParams>>
    > = await this.fetchAPI(path, mergedParams, requestInit, localized.options)

    // return last published entry
    return {
      data: response.data.pop() ?? null,
      meta: {},
    }
  }

  /**
   * Fetches a single entity by full path
   */
  public async fetchOneByFullPath<
    TContentTypeUID extends UID.ContentType,
    TParams extends AppLocalizedParams<FindMany<TContentTypeUID>>,
  >(
    uid: TContentTypeUID,
    fullPath: string | null,
    params?: TParams,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<
    APIResponseWithBreadcrumbs<
      Result<TContentTypeUID, DynamicZonePopulateParams<TParams>> &
        PageLocalization
    >
  > {
    const slugFilter =
      fullPath && fullPath.length > 0 ? { $eq: fullPath } : { $null: true }
    const localized = normalizeLocaleForUid(uid, params, options)
    const mergedParams = {
      ...localized.params,
      sort: { publishedAt: "desc" },
      filters: { ...localized.params?.filters, fullPath: slugFilter },
      pagination: {
        page: 1,
        pageSize: 1,
      },
    }
    const path = this.getStrapiApiPathByUId(uid)

    const response: APIResponseCollection<Result<TContentTypeUID, TParams>> =
      await this.fetchAPI(path, mergedParams, requestInit, localized.options)

    // return last published entry
    return {
      // @ts-expect-error localizations field is not in the response type
      // @dominik-juriga
      data: response.data.pop() ?? null,
      meta: response.meta,
    }
  }

  protected abstract prepareRequest(
    path: string,
    params: object,
    requestInit?: RequestInit,
    options?: CustomFetchOptions
  ): Promise<{ url: string; headers: Record<string, string> }>

  /**
   * Get Path of the API route by UID
   * @param uid - UID of the Endpoint
   * @returns API Endpoint path
   */
  public getStrapiApiPathByUId(uid: keyof typeof API_ENDPOINTS): string {
    const path = API_ENDPOINTS[uid]
    if (path) {
      return path
    }
    throw new Error(
      `Endpoint for UID "${uid}" not found. Extend API_ENDPOINTS in lib/api/client.ts.`
    )
  }

  private async parseResponse(response: Response) {
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      return {
        contentType,
        json: await response.json(),
      }
    }

    return {
      contentType,
      text: await response.text(),
    }
  }
}
