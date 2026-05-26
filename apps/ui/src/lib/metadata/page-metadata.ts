import type { UID } from "@repo/strapi-types"
import type { Metadata } from "next"
import type { Locale } from "next-intl"

import {
  assembleMetadataFromSeo,
  resolveMetadataDefaults,
} from "@/lib/metadata/build-from-seo"
import { fetchSeo } from "@/lib/strapi-api/content/server"
import type { StrapiLocalization } from "@/types/api"

export async function getMetadataFromStrapi({
  fullPath,
  locale,
  customMetadata,
  uid = "api::page.page",
}: {
  fullPath?: string
  locale: Locale
  customMetadata?: Metadata
  uid?: Extract<UID.ContentType, "api::page.page">
}): Promise<Metadata | null> {
  const defaults = await resolveMetadataDefaults(locale, fullPath)

  if (!defaults) {
    return null
  }

  if (!fullPath) {
    const { alternates: customAlternates, ...restCustomMetadata } =
      customMetadata ?? {}

    return {
      ...defaults.defaultMeta,
      openGraph: defaults.defaultOgMeta,
      twitter: defaults.defaultTwitterMeta,
      ...(customAlternates ? { alternates: customAlternates } : {}),
      ...restCustomMetadata,
    }
  }

  try {
    const res = await fetchSeo(uid, fullPath, locale)
    const { seo, localizations } = res?.data || {}

    return assembleMetadataFromSeo({
      defaults,
      seo,
      fullPath,
      locale,
      localizations: localizations as StrapiLocalization[] | undefined,
      customMetadata,
    })
  } catch (e: unknown) {
    console.warn(
      `SEO for ${uid} content type ("${fullPath}") wasn't fetched:`,
      (e as Error)?.message
    )

    const { alternates: customAlternates, ...restCustomMetadata } =
      customMetadata ?? {}

    return {
      ...defaults.defaultMeta,
      openGraph: defaults.defaultOgMeta,
      twitter: defaults.defaultTwitterMeta,
      ...(customAlternates ? { alternates: customAlternates } : {}),
      ...restCustomMetadata,
    }
  }
}
