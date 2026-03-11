import type { UID } from "@repo/strapi-types"
import { mergeWith } from "lodash"
import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { getEnvVar } from "@/lib/env-vars"
import { isProduction } from "@/lib/general-helpers"
import {
  getDefaultMetadata,
  getDefaultOgMeta,
  getDefaultTwitterMeta,
} from "@/lib/metadata/defaults"
import {
  getMetaAlternates,
  getMetaRobots,
  preprocessSocialMetadata,
  seoMergeCustomizer,
} from "@/lib/metadata/helpers"
import { fetchGlobalSeo, fetchSeo } from "@/lib/strapi-api/content/server"
import type { SocialMetadata } from "@/types/general"

export async function getMetadataFromStrapi({
  fullPath,
  locale,
  customMetadata,
  uid = "api::page.page",
}: {
  fullPath?: string
  locale: Locale
  customMetadata?: Metadata
  // Add more content types here if we want to fetch SEO components for them
  uid?: Extract<UID.ContentType, "api::page.page">
}): Promise<Metadata | null> {
  const t = await getTranslations({ locale, namespace: "seo" })
  const siteUrl = getEnvVar("APP_PUBLIC_URL")
  if (!siteUrl) {
    console.warn("APP_PUBLIC_URL is not defined, cannot generate metadata")

    return null
  }

  const translationMeta: Metadata = getDefaultMetadata(siteUrl, t)
  const translationOgMeta: Metadata["openGraph"] = getDefaultOgMeta(
    locale,
    fullPath,
    t
  )
  const translationTwitterMeta: Metadata["twitter"] = getDefaultTwitterMeta(t)

  // Merge Global SEO from Strapi on top of translation defaults
  const globalRes = await fetchGlobalSeo()
  const globalSeo = globalRes?.data?.defaultSeo

  const globalStrapiMeta: Metadata = {
    title: globalSeo?.metaTitle,
    description: globalSeo?.metaDescription,
    keywords: globalSeo?.keywords,
    robots: globalSeo?.metaRobots,
    applicationName: globalSeo?.applicationName,
  }
  const globalSocialMeta = preprocessSocialMetadata(globalSeo)

  const defaultMeta = mergeWith(
    translationMeta,
    globalStrapiMeta,
    seoMergeCustomizer
  )
  const defaultOgMeta = mergeWith(
    translationOgMeta,
    globalSocialMeta.openGraph,
    seoMergeCustomizer
  )
  const defaultTwitterMeta = mergeWith(
    translationTwitterMeta,
    globalSocialMeta.twitter,
    seoMergeCustomizer
  )

  // skip page-level strapi fetching and return merged defaults
  if (!fullPath) {
    return {
      ...defaultMeta,
      openGraph: defaultOgMeta,
      twitter: defaultTwitterMeta,
    }
  }

  try {
    return await fetchAndMapStrapiMetadata(
      locale,
      fullPath,
      defaultMeta,
      defaultOgMeta,
      defaultTwitterMeta,
      customMetadata,
      uid
    )
  } catch (e: unknown) {
    console.warn(
      `SEO for ${uid} content type ("${fullPath}") wasn't fetched:`,
      (e as Error)?.message
    )

    return {
      ...defaultMeta,
      openGraph: defaultOgMeta,
      twitter: defaultTwitterMeta,
    }
  }
}

async function fetchAndMapStrapiMetadata(
  locale: Locale,
  fullPath: string | null,
  defaultMeta: Metadata,
  defaultOgMeta: Metadata["openGraph"],
  defaultTwitterMeta: Metadata["twitter"],
  customMetadata?: Metadata,
  uid: Extract<UID.ContentType, "api::page.page"> = "api::page.page"
) {
  const forbidIndexing = !isProduction()
  const res = await fetchSeo(uid, fullPath, locale)

  const { seo, localizations } = res?.data || {}

  const strapiMeta: Metadata = {
    title: seo?.metaTitle,
    description: seo?.metaDescription,
    keywords: seo?.keywords,
    robots: seo?.metaRobots,
    applicationName: seo?.applicationName,
  }

  const robots = getMetaRobots(seo?.metaRobots, forbidIndexing)
  const alternates = getMetaAlternates({
    seo,
    fullPath,
    locale,
    localizations,
  })
  const strapiSocialMeta: SocialMetadata = preprocessSocialMetadata(
    seo,
    alternates?.canonical
  )

  return {
    ...mergeWith(defaultMeta, strapiMeta, seoMergeCustomizer),
    openGraph: mergeWith(
      defaultOgMeta,
      strapiSocialMeta.openGraph,
      seoMergeCustomizer
    ),
    twitter: mergeWith(
      defaultTwitterMeta,
      strapiSocialMeta.twitter,
      seoMergeCustomizer
    ),
    robots,
    alternates,
    ...customMetadata,
  }
}
