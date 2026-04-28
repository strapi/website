import { normalizePageFullPath } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"
import type { Metadata } from "next"
import type { Locale } from "next-intl"

// TODO: REMOVE BEFORE PRODUCTION DEPLOY — restore the `metaRobots` import once
// `getMetaRobots` is reverted to its original Strapi-driven logic (see git
// history of this file). Import removed to satisfy the no-unused-imports rule.
// import { metaRobots } from "@/lib/metadata/constants"
import { routing } from "@/lib/navigation"
import type { StrapiLocalization } from "@/types/api"
import type { NextMetadataTwitterCard, SocialMetadata } from "@/types/general"

type SeoComponent = Data.Component<"shared.seo">
type MetaSocialEntry = NonNullable<SeoComponent>["metaSocial"] extends
  | (infer T)[]
  | null
  | undefined
  ? T
  : never

const findSocialEntry = (
  metaSocial: MetaSocialEntry[] | null | undefined,
  network: "Facebook" | "Twitter"
): MetaSocialEntry | undefined =>
  metaSocial?.find((entry) => entry?.socialNetwork === network)

export const preprocessSocialMetadata = (
  seo: SeoComponent | null | undefined,
  canonicalUrl?: string
): SocialMetadata => {
  const fb = findSocialEntry(seo?.metaSocial, "Facebook")
  const tw = findSocialEntry(seo?.metaSocial, "Twitter")

  const ogImage = fb?.image ?? seo?.metaImage
  const twitterImage = tw?.image ?? seo?.metaImage

  const card: NextMetadataTwitterCard = "summary_large_image"

  return {
    twitter: {
      card,
      title: tw?.title ?? seo?.metaTitle ?? undefined,
      description: tw?.description ?? seo?.metaDescription ?? undefined,
      images: twitterImage?.url ? [twitterImage.url] : undefined,
    },
    openGraph: {
      title: fb?.title ?? seo?.metaTitle ?? undefined,
      description: fb?.description ?? seo?.metaDescription ?? undefined,
      url: canonicalUrl ?? undefined,
      images: ogImage
        ? [
            {
              url: ogImage?.url ?? "",
              width: ogImage?.width ?? 0,
              height: ogImage?.height ?? 0,
              alt: ogImage?.alternativeText ?? "",
            },
          ]
        : undefined,
    },
  }
}

export const seoMergeCustomizer = (
  defaultValue: unknown,
  strapiValue: unknown
) => strapiValue ?? defaultValue

export const getMetaRobots = (
  _robotsString?: string | Metadata["robots"] | null,
  _forbidIndexing?: boolean
) => {
  // TODO: REMOVE BEFORE PRODUCTION DEPLOY — force noindex/nofollow on every
  // page regardless of Strapi SEO config / env. Revert this function to its
  // prior implementation (see git history) once we're on the production URL.
  return { index: false, follow: false }
}

export const getMetaAlternates = ({
  seo,
  fullPath,
  locale,
  localizations,
}: {
  seo: SeoComponent | null | undefined
  fullPath: string | null
  locale: Locale
  localizations?: StrapiLocalization[]
}) => {
  const canonicalUrl = seo?.canonicalURL ?? fullPath ?? ""

  const languages = Array.isArray(localizations)
    ? {
        // Only available languages should be added as alternates
        ...localizations?.reduce((acc, curr) => {
          if (!curr.locale) {
            return acc
          }

          return {
            ...acc,
            [curr.locale]: normalizePageFullPath([canonicalUrl], curr.locale),
          }
        }, {}),
        // If you are on defaultLocale, it should point to the en version too
        ...(locale === routing.defaultLocale
          ? {
              [routing.defaultLocale]: normalizePageFullPath(
                [canonicalUrl],
                routing.defaultLocale
              ),
            }
          : {}),
        // x-default should be added to point to defaultLocale version if exists
        ...(locale === routing.defaultLocale ||
        localizations?.find((lang) => lang.locale === routing.defaultLocale)
          ? {
              "x-default": normalizePageFullPath(
                [canonicalUrl],
                routing.defaultLocale
              ),
            }
          : {}),
      }
    : undefined

  const canonical = canonicalUrl
    ? normalizePageFullPath([canonicalUrl], locale)
    : undefined

  return {
    canonical,
    languages,
  }
}
