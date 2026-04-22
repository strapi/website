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
  getMetaRobots,
  preprocessSocialMetadata,
  seoMergeCustomizer,
} from "@/lib/metadata/helpers"
import {
  fetchCaseStudySeo,
  fetchGlobalSeo,
} from "@/lib/strapi-api/content/server"

export async function getCaseStudyMetadata({
  slug,
  locale,
}: {
  slug: string
  locale: Locale
}): Promise<Metadata | null> {
  const t = await getTranslations({ locale, namespace: "seo" })
  const siteUrl = getEnvVar("APP_PUBLIC_URL")

  if (!siteUrl) {
    return null
  }

  const translationMeta = getDefaultMetadata(siteUrl, t)
  const translationOgMeta = getDefaultOgMeta(locale, `/user-stories/${slug}`, t)
  const translationTwitterMeta = getDefaultTwitterMeta(t)

  const globalRes = await fetchGlobalSeo()
  const globalSeo = globalRes?.data?.defaultSeo

  const globalStrapiMeta: Metadata = {
    title: globalSeo?.metaTitle,
    description: globalSeo?.metaDescription,
    keywords: globalSeo?.keywords,
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

  try {
    const res = await fetchCaseStudySeo(slug, locale)
    const caseStudy = res?.data
    const seo = caseStudy?.seo

    const fallbackMeta: Metadata = {
      title: caseStudy?.title,
      description: caseStudy?.description,
    }

    if (!seo) {
      return {
        ...mergeWith(defaultMeta, fallbackMeta, seoMergeCustomizer),
        openGraph: defaultOgMeta,
        twitter: defaultTwitterMeta,
      }
    }

    const strapiMeta: Metadata = {
      title: seo.metaTitle ?? caseStudy?.title,
      description: seo.metaDescription ?? caseStudy?.description,
      keywords: seo.keywords,
    }

    const forbidIndexing = !isProduction()
    const robots = getMetaRobots(seo.metaRobots, forbidIndexing)
    const strapiSocialMeta = preprocessSocialMetadata(seo)

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
    }
  } catch (e: unknown) {
    console.warn(
      `Case study SEO for "${slug}" wasn't fetched:`,
      e instanceof Error ? e.message : String(e)
    )

    return {
      ...defaultMeta,
      openGraph: defaultOgMeta,
      twitter: defaultTwitterMeta,
    }
  }
}
