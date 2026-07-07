import type { Data } from "@repo/strapi-types"
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
import { fetchGlobalSeo } from "@/lib/strapi-api/content/server"
import type { StrapiLocalization } from "@/types/api"
import type { SocialMetadata } from "@/types/general"

export type SeoComponent = Data.Component<"shared.seo">

export interface ResolvedMetadataDefaults {
  defaultMeta: Metadata
  defaultOgMeta: Metadata["openGraph"]
  defaultTwitterMeta: Metadata["twitter"]
}

export interface AssembleMetadataFromSeoParams {
  defaults: ResolvedMetadataDefaults
  seo?: SeoComponent | null
  fullPath: string
  locale: Locale
  localizations?: StrapiLocalization[]
  fallbackMeta?: Metadata
  customMetadata?: Metadata
}

export async function resolveMetadataDefaults(
  locale: Locale,
  fullPath?: string
): Promise<ResolvedMetadataDefaults | null> {
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

  const globalRes = await fetchGlobalSeo()
  const globalSeo = globalRes?.data?.defaultSeo

  const globalStrapiMeta: Metadata = {
    title: globalSeo?.metaTitle,
    description: globalSeo?.metaDescription,
    keywords: globalSeo?.keywords,
    robots: globalSeo?.metaRobots,
  }
  const globalSocialMeta: SocialMetadata = preprocessSocialMetadata(globalSeo)

  return {
    defaultMeta: mergeWith(
      translationMeta,
      globalStrapiMeta,
      seoMergeCustomizer
    ),
    defaultOgMeta: mergeWith(
      translationOgMeta,
      globalSocialMeta.openGraph,
      seoMergeCustomizer
    ),
    defaultTwitterMeta: mergeWith(
      translationTwitterMeta,
      globalSocialMeta.twitter,
      seoMergeCustomizer
    ),
  }
}

export function assembleMetadataFromSeo({
  defaults,
  seo,
  fullPath,
  locale,
  localizations,
  fallbackMeta,
  customMetadata,
}: AssembleMetadataFromSeoParams): Metadata {
  const forbidIndexing = !isProduction()

  const strapiMeta: Metadata = {
    title: seo?.metaTitle,
    description: seo?.metaDescription,
    keywords: seo?.keywords,
    robots: seo?.metaRobots,
  }

  const robots = getMetaRobots(
    seo?.metaRobots ?? defaults.defaultMeta.robots,
    forbidIndexing
  )
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

  const mergedBase = mergeWith(
    defaults.defaultMeta,
    fallbackMeta,
    strapiMeta,
    seoMergeCustomizer
  )

  const { alternates: customAlternates, ...restCustomMetadata } =
    customMetadata ?? {}

  return {
    ...mergedBase,
    openGraph: mergeWith(
      defaults.defaultOgMeta,
      strapiSocialMeta.openGraph,
      seoMergeCustomizer
    ),
    twitter: mergeWith(
      defaults.defaultTwitterMeta,
      strapiSocialMeta.twitter,
      seoMergeCustomizer
    ),
    robots,
    alternates: customAlternates
      ? { ...alternates, ...customAlternates }
      : alternates,
    ...restCustomMetadata,
  }
}

export interface GetMetadataFromSeoEntryParams {
  locale: Locale
  fullPath: string
  seo?: SeoComponent | null
  localizations?: StrapiLocalization[]
  fallbackMeta?: Metadata
  customMetadata?: Metadata
}

export async function getMetadataFromSeoEntry({
  locale,
  fullPath,
  seo,
  localizations,
  fallbackMeta,
  customMetadata,
}: GetMetadataFromSeoEntryParams): Promise<Metadata | null> {
  const defaults = await resolveMetadataDefaults(locale, fullPath)

  if (!defaults) {
    return null
  }

  return assembleMetadataFromSeo({
    defaults,
    seo,
    fullPath,
    locale,
    localizations,
    fallbackMeta,
    customMetadata,
  })
}
