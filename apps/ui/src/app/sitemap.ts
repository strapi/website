import type { MetadataRoute } from "next"
import type { Locale } from "next-intl"

import { getEnvVar } from "@/lib/env-vars"
import { isDevelopment, isProduction } from "@/lib/general-helpers"
import { createPublicFullPath, routing } from "@/lib/navigation"
import {
  fetchAllBlogAuthorSlugs,
  fetchAllBlogPosts,
  fetchAllCaseStudies,
  fetchAllPages,
  fetchAllPostCategories,
  fetchAllPostTags,
} from "@/lib/strapi-api/content/server"

// This should be static or dynamic based on build/runtime needs
export const dynamic = "force-dynamic"

/**
 * Note: We could use generateSitemaps to separate the sitemaps, however that does not create the root sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isProduction() && !isDevelopment()) {
    // Deployment environments other than production should not generate sitemap
    return []
  }

  if (!getEnvVar("APP_PUBLIC_URL")) {
    return []
  }

  const promises = routing.locales.map((locale) =>
    generateLocalizedSitemap(locale)
  )
  const results = await Promise.allSettled(promises)

  return results
    .filter((result) => result.status === "fulfilled")
    .reduce((acc, curr) => {
      acc.push(...curr.value)

      return acc
    }, [] as MetadataRoute.Sitemap)
}

/**
 * Fetches all entries in a given collection - by default this is api::page.page
 * and generates sitemap entries for a single locale
 * @param locale locale to retrieve (must be defined in routing `@/lib/navigation`)
 * @returns Sitemap entries for a single locale
 */
async function generateLocalizedSitemap(
  locale: Locale
): Promise<MetadataRoute.Sitemap> {
  const pageEntities: Partial<
    Record<PageEntityUID, Awaited<ReturnType<typeof fetchAllPages>>["data"]>
  > = {}

  // Fetch all records for each entity individually
  for (const entityUid of pageEntityUids) {
    const entityResponse = await fetchAllPages(entityUid, locale)

    if (entityResponse.data.length > 0) {
      pageEntities[entityUid] = entityResponse.data
    }
  }

  /**
   * iterate over all pageable collections, and push each entry into the sitemap array,
   * alongside mapping of changeFrequency
   */
  const pageEntries = Object.entries(pageEntities).reduce(
    (acc, [uid, pages]) => {
      pages.forEach((page) => {
        if (page.fullPath) {
          acc.push({
            url: createPublicFullPath(page.fullPath, String(page.locale)),
            lastModified: page.updatedAt ?? page.createdAt ?? undefined,
            changeFrequency:
              entityChangeFrequency[uid as PageEntityUID] ?? "monthly",
          })
        }
      })

      return acc
    },
    [] as MetadataRoute.Sitemap
  )

  const [caseStudiesRes, blogPostsRes, categoriesRes, tagsRes, authorSlugs] =
    await Promise.all([
      fetchAllCaseStudies(locale),
      fetchAllBlogPosts(locale),
      fetchAllPostCategories(locale),
      fetchAllPostTags(locale),
      fetchAllBlogAuthorSlugs(locale),
    ])

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudiesRes.data.map(
    (cs) => ({
      // case-study is not localized in Strapi, so cs.locale is undefined — fall back to the requested locale
      url: createPublicFullPath(
        `/user-stories/${cs.slug}`,
        cs.locale ?? locale
      ),
      lastModified: cs.updatedAt ?? cs.createdAt ?? undefined,
      changeFrequency: "weekly",
    })
  )

  const blogPostEntries: MetadataRoute.Sitemap = blogPostsRes.data
    .filter((post) => post.slug)
    .map((post) => ({
      url: createPublicFullPath(`/blog/${post.slug}`, post.locale ?? locale),
      lastModified: post.updatedAt ?? post.createdAt ?? undefined,
      changeFrequency: "weekly",
    }))

  const categoryEntries: MetadataRoute.Sitemap = categoriesRes.data
    .filter((category) => category.slug)
    .map((category) => ({
      url: createPublicFullPath(`/blog/categories/${category.slug}`, locale),
      lastModified: category.updatedAt ?? category.createdAt ?? undefined,
      changeFrequency: "weekly",
    }))

  const tagEntries: MetadataRoute.Sitemap = tagsRes.data
    .filter((tag) => tag.slug)
    .map((tag) => ({
      url: createPublicFullPath(`/blog/tags/${tag.slug}`, locale),
      lastModified: tag.updatedAt ?? tag.createdAt ?? undefined,
      changeFrequency: "weekly",
    }))

  // Author slugs are derived from posts, so there is no per-author
  // `updatedAt` available without an extra /users round-trip.
  const authorEntries: MetadataRoute.Sitemap = authorSlugs.map((slug) => ({
    url: createPublicFullPath(`/user/${slug}`, locale),
    changeFrequency: "weekly",
  }))

  return [
    ...pageEntries,
    ...caseStudyEntries,
    ...blogPostEntries,
    ...categoryEntries,
    ...tagEntries,
    ...authorEntries,
  ]
}

// Should you have multiple "pageable" collections, add them to this array
const pageEntityUids = ["api::page.page"] as const

type PageEntityUID = (typeof pageEntityUids)[number]

/**
 * Object that determines default changeFrequency attribute for crawlers.
 * For example, pages may change once a month or year, whereas blog articles could update weekly
 */
const entityChangeFrequency: Record<
  PageEntityUID,
  MetadataRoute.Sitemap[number]["changeFrequency"]
> = {
  "api::page.page": "monthly",
}
