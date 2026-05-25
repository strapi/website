import type { Locale } from "next-intl"

import type { SeoComponent } from "@/lib/metadata/build-from-seo"
import { fetchSeo } from "@/lib/strapi-api/content/server"

import { StrapiStructuredData } from "./StrapiStructuredData"

interface FromSeoProps {
  readonly seo?: SeoComponent | null
  readonly scriptId?: string
}

/** Renders JSON-LD from an already-loaded `shared.seo` component. */
export function StrapiSeoStructuredDataFromSeo({
  seo,
  scriptId = "strapiSeoStructuredData",
}: FromSeoProps) {
  return (
    <StrapiStructuredData structuredData={seo?.structuredData} id={scriptId} />
  )
}

interface ByFullPathProps {
  readonly fullPath: string
  readonly locale: Locale
  readonly scriptId?: string
}

/** Loads page SEO by `fullPath` and renders JSON-LD when `structuredData` is set. */
export async function StrapiSeoStructuredDataByFullPath({
  fullPath,
  locale,
  scriptId = "strapiSeoStructuredData",
}: ByFullPathProps) {
  const res = await fetchSeo("api::page.page", fullPath, locale)

  return (
    <StrapiStructuredData
      structuredData={res?.data?.seo?.structuredData}
      id={scriptId}
    />
  )
}
