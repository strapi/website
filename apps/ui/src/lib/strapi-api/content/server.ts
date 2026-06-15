import "server-only"

import type { FindFirst, UID } from "@repo/strapi-types"
import { draftMode } from "next/headers"
import type { Locale } from "next-intl"

import type { BlogPost } from "@/lib/blog-utils"
import { logNonBlockingError } from "@/lib/logging"
import { PublicStrapiClient } from "@/lib/strapi-api"
import type { CustomFetchOptions } from "@/types/general"

// ------ Cache tag map
//
// One tag per Strapi content type (`strapi:<uid>`). The Strapi-side document
// middleware (`apps/strapi/src/documentMiddlewares/revalidate.ts`) calls
// `revalidateTag(tag, "max")` after writes, so any fetch tagged below is
// invalidated as soon as the editor publishes.

const STRAPI_TAGS = {
  page: ["strapi:api::page.page"] as const,
  blogPost: ["strapi:api::blog-post.blog-post"] as const,
  postCategory: ["strapi:api::post-category.post-category"] as const,
  postTag: ["strapi:api::post-tag.post-tag"] as const,
  caseStudy: ["strapi:api::case-study.case-study"] as const,
  cms: ["strapi:api::cms.cms"] as const,
  cmsComparison: ["strapi:api::cms-comparison.cms-comparison"] as const,
  blog: ["strapi:api::blog.blog"] as const,
  global: ["strapi:api::global.global"] as const,
  header: ["strapi:api::header.header"] as const,
  footer: ["strapi:api::footer.footer"] as const,
  notFound: ["strapi:api::not-found.not-found"] as const,
} as const

/**
 * Build a `RequestInit` that is safe to pass to the Strapi client:
 *  - In draft mode, opt out of Next.js caching entirely (`cache: "no-store"`)
 *    so editors see live changes and draft content never seeds the public tag.
 *  - Otherwise tag the fetch so it can be invalidated on demand.
 */
function withCacheTags(
  isDraftMode: boolean,
  tags: readonly string[],
  base?: RequestInit
): RequestInit {
  if (isDraftMode) {
    return { ...base, cache: "no-store" }
  }

  const callerTags = base?.next?.tags ?? []

  return {
    ...base,
    next: { ...base?.next, tags: [...callerTags, ...tags] },
  }
}

// ------ Shared populate objects

const authorPopulate = {
  populate: {
    avatar: {
      populate: { image: { populate: { media: true } } },
    },
  },
}

const seoPopulate = {
  populate: {
    metaImage: true,
    metaSocial: { populate: { image: true } },
  },
}

// ------ Page fetching functions

export async function fetchPage(
  fullPath: string,
  locale: Locale,
  requestInit?: RequestInit,
  options?: CustomFetchOptions
) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneByFullPath(
      "api::page.page",
      fullPath,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: { seo: seoPopulate },
        populateDynamicZone: { content: true },
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.page, requestInit),
      options
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching page '${fullPath}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchAllPages(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  uid: Extract<UID.ContentType, "api::page.page"> = "api::page.page",
  locale: Locale
) {
  try {
    return await PublicStrapiClient.fetchAll(
      uid,
      {
        locale,
        fields: ["fullPath", "locale", "updatedAt", "createdAt", "slug"],
        populate: {},
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.page)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all pages for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

// ------ Blog post fetching functions

export async function fetchBlogPost(
  slug: string,
  locale: Locale,
  requestInit?: RequestInit,
  options?: CustomFetchOptions
) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::blog-post.blog-post",
      slug,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: {
          image: {
            populate: { image: { populate: { media: true } } },
          },
          coverImage: { populate: { media: true } },
          author: authorPopulate,
          coauthors: authorPopulate,
          category: {
            populate: { parent: { fields: ["name", "slug"] } },
          },
          tags: true,
          seo: seoPopulate,
        } as Record<string, unknown>,
        populateDynamicZone: { sections: true },
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.blogPost, requestInit),
      options
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching blog post '${slug}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

const blogListPopulate = {
  image: {
    populate: { image: { populate: { media: true } } },
  },
  coverImage: { populate: { media: true } },
  author: authorPopulate,
  coauthors: authorPopulate,
  category: true,
} as Record<string, unknown>

export async function fetchBlogPostsList(
  locale: Locale,
  categorySlug?: string | readonly string[],
  limit?: number,
  tagSlug?: string
) {
  const dm = await draftMode()

  const slugs = Array.isArray(categorySlug)
    ? categorySlug
    : categorySlug
      ? [categorySlug as string]
      : null

  const conditions: Record<string, unknown>[] = []
  if (slugs && slugs.length > 0) {
    conditions.push({ category: { slug: { $in: slugs } } })
  }
  if (tagSlug) {
    conditions.push({ tags: { slug: { $eq: tagSlug } } })
  }

  const filters = conditions.length > 0 ? { filters: { $and: conditions } } : {}

  const cacheTags = tagSlug
    ? [...STRAPI_TAGS.blogPost, ...STRAPI_TAGS.postTag]
    : STRAPI_TAGS.blogPost
  const requestInit = withCacheTags(dm.isEnabled, cacheTags)

  try {
    if (typeof limit === "number") {
      return await PublicStrapiClient.fetchMany(
        "api::blog-post.blog-post",
        {
          locale,
          status: dm.isEnabled ? "draft" : "published",
          sort: { originalPublishedAt: "desc" },
          ...filters,
          populate: blogListPopulate,
          pagination: { page: 1, pageSize: limit },
        } as unknown as Parameters<typeof PublicStrapiClient.fetchMany>[1],
        requestInit
      )
    }

    return await PublicStrapiClient.fetchAll(
      "api::blog-post.blog-post",
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        sort: { originalPublishedAt: "desc" },
        ...filters,
        populate: blogListPopulate,
      },
      requestInit
    )
  } catch (e: unknown) {
    const scopeParts: string[] = []
    if (slugs) scopeParts.push(`categories '${slugs.join(",")}'`)
    if (tagSlug) scopeParts.push(`tag '${tagSlug}'`)
    const scope =
      scopeParts.length > 0 ? ` for ${scopeParts.join(" and ")}` : ""

    logNonBlockingError({
      message: `Error fetching blog posts${scope} for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export interface BlogPostsPage {
  readonly posts: BlogPost[]
  readonly total: number
}

/**
 * Offset-paginated blog post fetch used by the blog index "Load More" flow.
 * Unlike {@link fetchBlogPostsList} (which caps at a single `pageSize`), this
 * returns a window `[offset, offset + limit)` plus the total count so the
 * caller can decide whether more posts remain.
 */
export async function fetchBlogPostsPage(
  locale: Locale,
  options: {
    readonly offset: number
    readonly limit: number
    readonly categorySlug?: string | readonly string[]
    readonly tagSlug?: string
  }
): Promise<BlogPostsPage> {
  const { offset, limit, categorySlug, tagSlug } = options
  const dm = await draftMode()

  const slugs = Array.isArray(categorySlug)
    ? categorySlug
    : categorySlug
      ? [categorySlug as string]
      : null

  const conditions: Record<string, unknown>[] = []
  if (slugs && slugs.length > 0) {
    conditions.push({ category: { slug: { $in: slugs } } })
  }
  if (tagSlug) {
    conditions.push({ tags: { slug: { $eq: tagSlug } } })
  }

  const filters = conditions.length > 0 ? { filters: { $and: conditions } } : {}

  const cacheTags = tagSlug
    ? [...STRAPI_TAGS.blogPost, ...STRAPI_TAGS.postTag]
    : STRAPI_TAGS.blogPost
  const requestInit = withCacheTags(dm.isEnabled, cacheTags)

  try {
    const res = await PublicStrapiClient.fetchMany(
      "api::blog-post.blog-post",
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        sort: { originalPublishedAt: "desc" },
        ...filters,
        populate: blogListPopulate,
        pagination: { start: offset, limit },
      } as unknown as Parameters<typeof PublicStrapiClient.fetchMany>[1],
      requestInit
    )

    const posts = (res.data ?? []) as unknown as BlogPost[]

    return {
      posts,
      total: res.meta?.pagination?.total ?? offset + posts.length,
    }
  } catch (e: unknown) {
    const scopeParts: string[] = []
    if (slugs) scopeParts.push(`categories '${slugs.join(",")}'`)
    if (tagSlug) scopeParts.push(`tag '${tagSlug}'`)
    const scope =
      scopeParts.length > 0 ? ` for ${scopeParts.join(" and ")}` : ""

    logNonBlockingError({
      message: `Error fetching blog posts page${scope} for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { posts: [], total: 0 }
  }
}

export async function fetchAllBlogPosts(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll(
      "api::blog-post.blog-post",
      {
        locale,
        fields: ["slug", "locale", "updatedAt", "createdAt"],
        populate: {},
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.blogPost)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all blog posts for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchBlogPostSeo(slug: string, locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::blog-post.blog-post",
      slug,
      {
        locale,
        fields: ["title", "description"],
        populate: {
          seo: seoPopulate,
        },
      },
      withCacheTags(false, STRAPI_TAGS.blogPost)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching blog post SEO for '${slug}' locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchPostCategory(slug: string, locale: Locale) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::post-category.post-category",
      slug,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: {
          seo: seoPopulate,
          parent: { fields: ["name", "slug"] },
          children: { fields: ["name", "slug"] },
        } as Record<string, unknown>,
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.postCategory)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching post category '${slug}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchPostTag(slug: string, locale: Locale) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::post-tag.post-tag",
      slug,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: {
          seo: seoPopulate,
        } as Record<string, unknown>,
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.postTag)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching post tag '${slug}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchAllPostTags(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll(
      "api::post-tag.post-tag",
      {
        locale,
        fields: ["slug", "name"],
        populate: {},
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.postTag)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all post tags for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchRelatedBlogPosts({
  currentSlug,
  categorySlug,
  locale,
  limit = 3,
  excludeSlugs = [],
}: {
  currentSlug: string
  categorySlug: string | null | undefined
  locale: Locale
  limit?: number
  excludeSlugs?: readonly string[]
}) {
  if (!categorySlug) return { data: [] }

  const notInSlugs = Array.from(new Set([currentSlug, ...excludeSlugs]))

  try {
    const res = await PublicStrapiClient.fetchMany(
      "api::blog-post.blog-post",
      {
        locale,
        status: "published",
        sort: { originalPublishedAt: "desc" },
        filters: {
          $and: [
            { category: { slug: { $eq: categorySlug } } },
            { slug: { $notIn: notInSlugs } },
          ],
        },
        pagination: { page: 1, pageSize: limit },
        populate: blogListPopulate,
      },
      withCacheTags(false, STRAPI_TAGS.blogPost)
    )

    return { ...res, data: (res.data ?? []).slice(0, limit) }
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching related blog posts for '${currentSlug}' locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchLatestBlogPosts({
  locale,
  excludeSlugs = [],
  limit = 3,
}: {
  locale: Locale
  excludeSlugs?: readonly string[]
  limit?: number
}) {
  const notInSlugs = Array.from(new Set(excludeSlugs))

  try {
    const res = await PublicStrapiClient.fetchMany(
      "api::blog-post.blog-post",
      {
        locale,
        status: "published",
        sort: { originalPublishedAt: "desc" },
        ...(notInSlugs.length > 0
          ? { filters: { slug: { $notIn: notInSlugs } } }
          : {}),
        pagination: { page: 1, pageSize: limit },
        populate: blogListPopulate,
      },
      withCacheTags(false, STRAPI_TAGS.blogPost)
    )

    return { ...res, data: (res.data ?? []).slice(0, limit) }
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching latest blog posts for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

// ------ Blog settings fetching functions

export async function fetchBlog(locale: Locale) {
  const params = {
    locale,
    populate: {
      navigation: {
        populate: {
          items: {
            fields: ["name", "slug"] as const,
            populate: {
              children: { fields: ["name", "slug"] as const },
            },
          },
        },
      },
      newsletter: {
        populate: { hubspotForm: true },
      },
    },
  } satisfies FindFirst<"api::blog.blog">

  try {
    return await PublicStrapiClient.fetchOne(
      "api::blog.blog",
      undefined,
      params,
      withCacheTags(false, STRAPI_TAGS.blog)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching blog settings for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

// ------ SEO fetching functions

export async function fetchSeo(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  uid: Extract<UID.ContentType, "api::page.page"> = "api::page.page",
  fullPath: string | null,
  locale: Locale
) {
  try {
    return await PublicStrapiClient.fetchOneByFullPath(
      uid,
      fullPath,
      {
        locale,
        populate: {
          seo: seoPopulate,
          localizations: true,
        },
      },
      withCacheTags(false, STRAPI_TAGS.page)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching SEO for '${uid}' with fullPath '${fullPath}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchGlobalSeo() {
  try {
    return await PublicStrapiClient.fetchOne(
      "api::global.global",
      undefined,
      {
        populate: {
          defaultSeo: seoPopulate,
        },
      },
      withCacheTags(false, STRAPI_TAGS.global)
    )
  } catch (e: unknown) {
    /**
     * An empty single type returns 404 — that's "no defaults configured",
     * not an error worth logging on every render.
     */
    if (e instanceof Error && e.message.includes('"status":404')) {
      return
    }

    logNonBlockingError({
      message: "Error fetching global SEO defaults",
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

// ------ CMS comparison fetching functions

export async function fetchCmsComparison(
  slug: string,
  locale: Locale,
  requestInit?: RequestInit,
  options?: CustomFetchOptions
) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::cms-comparison.cms-comparison",
      slug,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: {
          seo: seoPopulate,
        } as Record<string, unknown>,
        populateDynamicZone: { content: true },
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.cmsComparison, requestInit),
      options
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching CMS comparison '${slug}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchAllCmsComparisons(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll(
      "api::cms-comparison.cms-comparison",
      {
        locale,
        fields: ["slug", "locale", "updatedAt", "createdAt"],
        populate: {},
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.cmsComparison)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all CMS comparisons for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchCmsComparisonSeo(slug: string, locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::cms-comparison.cms-comparison",
      slug,
      {
        locale,
        populate: {
          seo: seoPopulate,
        },
      },
      withCacheTags(false, STRAPI_TAGS.cmsComparison)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching CMS comparison SEO for '${slug}' locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchAllCms(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll(
      "api::cms.cms",
      {
        locale,
        fields: ["name", "slug"],
        populate: {
          logo: { fields: ["url", "width", "height", "alternativeText"] },
          fields: true,
        } as Record<string, unknown>,
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.cms)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all CMS entries for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

// ------ Case study fetching functions

const caseStudyImagePopulate = {
  coverImage: { populate: { image: { populate: { media: true } } } },
  logoImage: { populate: { image: { populate: { media: true } } } },
} as const

const caseStudyListPopulate = {
  ...caseStudyImagePopulate,
  categories: { fields: ["name", "slug"] },
} as Record<string, unknown>

export async function fetchCaseStudy(
  slug: string,
  locale: Locale,
  requestInit?: RequestInit,
  options?: CustomFetchOptions
) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::case-study.case-study",
      slug,
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        populate: {
          ...caseStudyImagePopulate,
          categories: { fields: ["name", "slug"] },
          seo: seoPopulate,
        } as Record<string, unknown>,
        populateDynamicZone: { content: true },
      },
      withCacheTags(dm.isEnabled, STRAPI_TAGS.caseStudy, requestInit),
      options
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching case study '${slug}' for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchCaseStudiesList(locale: Locale, limit?: number) {
  const dm = await draftMode()

  const requestInit = withCacheTags(dm.isEnabled, STRAPI_TAGS.caseStudy)

  try {
    if (typeof limit === "number") {
      return await PublicStrapiClient.fetchMany(
        "api::case-study.case-study",
        {
          locale,
          status: dm.isEnabled ? "draft" : "published",
          sort: { originalPublishedAt: "desc" },
          populate: caseStudyListPopulate,
          pagination: { page: 1, pageSize: limit },
        } as unknown as Parameters<typeof PublicStrapiClient.fetchMany>[1],
        requestInit
      )
    }

    return await PublicStrapiClient.fetchAll(
      "api::case-study.case-study",
      {
        locale,
        status: dm.isEnabled ? "draft" : "published",
        sort: { originalPublishedAt: "desc" },
        populate: caseStudyListPopulate,
      },
      requestInit
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching case studies for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchAllCaseStudies(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll(
      "api::case-study.case-study",
      {
        locale,
        fields: ["slug", "locale", "updatedAt", "createdAt"],
        populate: {},
        status: "published",
      },
      withCacheTags(false, STRAPI_TAGS.caseStudy)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching all case studies for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchCaseStudySeo(slug: string, locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOneBySlug(
      "api::case-study.case-study",
      slug,
      {
        locale,
        fields: ["title", "description"],
        populate: {
          seo: seoPopulate,
        },
      },
      withCacheTags(false, STRAPI_TAGS.caseStudy)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching case study SEO for '${slug}' locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

// ------ Header & footer fetching functions

export async function fetchHeader(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOne(
      "api::header.header",
      undefined,
      {
        locale,
        populateDynamicZone: { content: true },
      },
      withCacheTags(false, STRAPI_TAGS.header)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching header for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

export async function fetchFooter(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOne(
      "api::footer.footer",
      undefined,
      {
        locale,
        populateDynamicZone: { content: true },
      },
      withCacheTags(false, STRAPI_TAGS.footer)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching footer for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}

// ------ Not Found (404) fetching function

export async function fetchNotFound(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOne(
      "api::not-found.not-found",
      undefined,
      {
        locale,
        populate: {
          image: { populate: { media: true } },
        },
        populateDynamicZone: { content: true },
      },
      withCacheTags(false, STRAPI_TAGS.notFound)
    )
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching not-found for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })
  }
}
