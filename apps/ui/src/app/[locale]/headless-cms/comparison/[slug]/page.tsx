import type { Locale } from "next-intl"
import { use } from "react"

import { CmsComparisonView } from "@/components/cms-comparison/CmsComparisonView"
import { createFallbackPath, debugStaticParams } from "@/lib/build"
import { isDevelopment } from "@/lib/general-helpers"
import { getCmsComparisonMetadata } from "@/lib/metadata/cms-comparison"
import { fetchAllCmsComparisons } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"
export const revalidate = 300

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  if (isDevelopment()) {
    debugStaticParams([], "headless-cms/comparison/[slug]", {
      isDevelopment: true,
    })

    return []
  }

  const results = await fetchAllCmsComparisons(locale as Locale)

  const params =
    results?.data.map((comparison) => ({
      locale: comparison.locale as Locale,
      slug: comparison.slug,
    })) ?? []

  debugStaticParams(params, "headless-cms/comparison/[slug]")

  const fallbackPath = createFallbackPath(locale as Locale, {
    slug: "fallback",
  })

  return params.length > 0 ? params : [fallbackPath]
}

export async function generateMetadata(
  props: PageProps<"/[locale]/headless-cms/comparison/[slug]">
) {
  const params = await props.params
  const locale = params.locale as Locale
  const slug = params.slug as string

  return getCmsComparisonMetadata({ slug, locale })
}

export default function CmsComparisonDetailPage(
  props: PageProps<"/[locale]/headless-cms/comparison/[slug]">
) {
  const params = use(props.params)

  return <CmsComparisonView params={params} />
}
