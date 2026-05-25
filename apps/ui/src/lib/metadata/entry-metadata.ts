import type { Data } from "@repo/strapi-types"
import type { Metadata } from "next"
import type { Locale } from "next-intl"

import {
  type SeoComponent,
  getMetadataFromSeoEntry,
} from "@/lib/metadata/build-from-seo"
import { getMetadataFromStrapi } from "@/lib/metadata/page-metadata"
import {
  fetchBlogPostSeo,
  fetchCaseStudySeo,
  fetchCmsComparisonSeo,
  fetchPostCategory,
  fetchPostTag,
} from "@/lib/strapi-api/content/server"

type WithSeo<T> = T & { seo?: SeoComponent | null }

export async function getBlogPostMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const fullPath = `/blog/${slug}`
  const res = await fetchBlogPostSeo(slug, locale)
  const post = res?.data

  return getMetadataFromSeoEntry({
    locale,
    fullPath,
    seo: post?.seo,
    fallbackMeta: {
      title: post?.seo?.metaTitle ?? post?.title ?? undefined,
      description: post?.seo?.metaDescription ?? post?.description ?? undefined,
    },
  })
}

export async function getCaseStudyMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const fullPath = `/user-stories/${slug}`
  const res = await fetchCaseStudySeo(slug, locale)
  const caseStudy = res?.data

  return getMetadataFromSeoEntry({
    locale,
    fullPath,
    seo: caseStudy?.seo,
    fallbackMeta: {
      title: caseStudy?.seo?.metaTitle ?? caseStudy?.title ?? undefined,
      description:
        caseStudy?.seo?.metaDescription ?? caseStudy?.description ?? undefined,
    },
  })
}

export async function getCmsComparisonMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const fullPath = `/headless-cms/comparison/${slug}`
  const res = await fetchCmsComparisonSeo(slug, locale)
  const comparison = res?.data as
    | WithSeo<Data.ContentType<"api::cms-comparison.cms-comparison">>
    | undefined

  return getMetadataFromSeoEntry({
    locale,
    fullPath,
    seo: comparison?.seo,
  })
}

export async function getPostCategoryMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const fullPath = `/blog/categories/${slug}`
  const res = await fetchPostCategory(slug, locale)
  const category = res?.data as
    | WithSeo<Data.ContentType<"api::post-category.post-category">>
    | undefined

  const fallbackName = slug
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())
  const name = category?.name ?? fallbackName

  return getMetadataFromSeoEntry({
    locale,
    fullPath,
    seo: category?.seo,
    fallbackMeta: {
      title: category?.seo?.metaTitle ?? `${name} — Blog`,
      description: category?.seo?.metaDescription ?? undefined,
    },
  })
}

export async function getPostTagMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const fullPath = `/blog/tags/${slug}`
  const res = await fetchPostTag(slug, locale)
  const tag = res?.data as
    | WithSeo<Data.ContentType<"api::post-tag.post-tag">>
    | undefined

  const fallbackName = slug
    .replaceAll("-", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())
  const name = tag?.name ?? fallbackName

  return getMetadataFromSeoEntry({
    locale,
    fullPath,
    seo: tag?.seo,
    fallbackMeta: {
      title: tag?.seo?.metaTitle ?? `${name} — Blog`,
      description: tag?.seo?.metaDescription ?? undefined,
    },
  })
}

export async function getBlogIndexMetadata({
  locale,
}: {
  locale: Locale
}): Promise<Metadata | null> {
  const { routing } = await import("@/lib/navigation")
  const localePath = routing.defaultLocale !== locale ? `/${locale}` : ""

  return getMetadataFromStrapi({
    locale,
    fullPath: "/blog",
    customMetadata: {
      alternates: {
        types: {
          "application/rss+xml": `${localePath}/blog/rss.xml`,
        },
      },
    },
  })
}
