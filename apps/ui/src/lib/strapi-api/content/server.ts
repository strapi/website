import "server-only"

import type { UID } from "@repo/strapi-types"
import { draftMode } from "next/headers"
import type { Locale } from "next-intl"

import { logNonBlockingError } from "@/lib/logging"
import { PublicStrapiClient } from "@/lib/strapi-api"
import type { CustomFetchOptions } from "@/types/general"

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
    twitter: { populate: { images: true } },
    og: { populate: { image: true } },
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
      requestInit,
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
    return await PublicStrapiClient.fetchAll(uid, {
      locale,
      fields: ["fullPath", "locale", "updatedAt", "createdAt", "slug"],
      populate: {},
      status: "published",
    })
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
          author: authorPopulate,
          coauthors: authorPopulate,
          category: true,
          tags: true,
          seo: seoPopulate,
        } as Record<string, unknown>,
        populateDynamicZone: { sections: true },
      },
      requestInit,
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
  author: authorPopulate,
  coauthors: authorPopulate,
  category: true,
} as Record<string, unknown>

export async function fetchBlogPostsList(
  locale: Locale,
  categorySlug?: string
) {
  const dm = await draftMode()

  try {
    return await PublicStrapiClient.fetchAll("api::blog-post.blog-post", {
      locale,
      status: dm.isEnabled ? "draft" : "published",
      sort: { publishedAt: "desc" },
      ...(categorySlug && {
        filters: { category: { slug: { $eq: categorySlug } } },
      }),
      populate: blogListPopulate,
    })
  } catch (e: unknown) {
    logNonBlockingError({
      message: `Error fetching blog posts${categorySlug ? ` for category '${categorySlug}'` : ""} for locale '${locale}'`,
      error: {
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      },
    })

    return { data: [] }
  }
}

export async function fetchAllBlogPosts(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchAll("api::blog-post.blog-post", {
      locale,
      fields: ["slug", "locale", "updatedAt", "createdAt"],
      populate: {},
      status: "published",
    })
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
        populate: {
          seo: seoPopulate,
        },
      }
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

// ------ Blog settings fetching functions

export async function fetchBlog(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOne("api::blog.blog", undefined, {
      locale,
      populate: {
        navigation: {
          populate: {
            items: { fields: ["name", "slug"] },
          },
        },
        newsletter: {
          populate: {
            image: {
              populate: { media: true },
            },
            hubspotForm: true,
          },
        },
      } as Record<string, unknown>,
    })
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
    return await PublicStrapiClient.fetchOneByFullPath(uid, fullPath, {
      locale,
      populate: {
        seo: seoPopulate,
        localizations: true,
      },
    })
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
    return await PublicStrapiClient.fetchOne("api::global.global", undefined, {
      populate: {
        defaultSeo: seoPopulate,
      },
    })
  } catch (e: unknown) {
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
      requestInit,
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
      }
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
      }
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
    return await PublicStrapiClient.fetchAll("api::cms.cms", {
      locale,
      fields: ["name", "slug"],
      populate: {
        logo: { fields: ["url", "width", "height", "alternativeText"] },
        fields: true,
      } as Record<string, unknown>,
      status: "published",
    })
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

// ------ Header & footer fetching functions

export async function fetchHeader(locale: Locale) {
  try {
    return await PublicStrapiClient.fetchOne("api::header.header", undefined, {
      locale,
      populateDynamicZone: { content: true },
    })
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
    return await PublicStrapiClient.fetchOne("api::footer.footer", undefined, {
      locale,
      populateDynamicZone: { content: true },
    })
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
