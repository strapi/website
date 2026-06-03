import type { Metadata } from "next"
import type { Locale } from "next-intl"
import type { getTranslations } from "next-intl/server"

import { routing } from "@/lib/navigation"

type TranslateFn = Awaited<ReturnType<typeof getTranslations>>

export function getDefaultMetadata(siteUrl: string, t: TranslateFn) {
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t("keywords"),
    robots: t("metaRobots"),

    // Favicon/manifest are defined once on the root layout so every route
    // inherits the full icon set; omit `icons` here so Next's shallow merge
    // doesn't replace it with just the .ico on SEO-driven pages.

    metadataBase: new URL(siteUrl),
  } as Metadata
}

export function getDefaultOgMeta(
  locale: Locale | undefined,
  fullPath: string | undefined,
  t: TranslateFn
): Metadata["openGraph"] {
  const image = t("og.image")

  return {
    type: "website",
    locale: locale,
    siteName: t("og.siteName"),
    title: t("og.title"),
    description: t("og.description"),
    // Only emit the tag when a default image is configured, otherwise we'd
    // render an empty/broken og:image on every page without its own SEO.
    ...(image ? { images: [image] } : {}),
    url: [routing.defaultLocale !== locale ? locale : null, fullPath ?? ""]
      .filter(Boolean)
      .join("/"),
  }
}

export function getDefaultTwitterMeta(t: TranslateFn): Metadata["twitter"] {
  const image = t("twitter.imageUrl")
  const siteId = t("twitter.siteId")
  const creator = t("twitter.creator")
  const creatorId = t("twitter.creatorId")

  // Spread optional fields only when set so we never emit empty meta tags.
  return {
    card: t("twitter.card"),
    title: t("twitter.title"),
    description: t("twitter.description"),
    ...(siteId ? { siteId } : {}),
    ...(creator ? { creator } : {}),
    ...(creatorId ? { creatorId } : {}),
    ...(image ? { images: [image] } : {}),
  } as Metadata["twitter"]
}
