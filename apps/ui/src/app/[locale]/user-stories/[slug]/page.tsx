import type { Locale } from "next-intl"

import { CaseStudyView } from "@/components/case-study/CaseStudyView"
import { createFallbackPath, debugStaticParams } from "@/lib/build"
import { isDevelopment } from "@/lib/general-helpers"
import { getCaseStudyMetadata } from "@/lib/metadata/case-study"
import { fetchAllCaseStudies } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string }
}) {
  if (isDevelopment()) {
    debugStaticParams([], "user-stories/[slug]", {
      isDevelopment: true,
    })

    return []
  }

  const results = await fetchAllCaseStudies(locale as Locale)

  const params =
    results?.data.map((caseStudy) => ({
      locale: caseStudy.locale as Locale,
      slug: caseStudy.slug,
    })) ?? []

  debugStaticParams(params, "user-stories/[slug]")

  const fallbackPath = createFallbackPath(locale as Locale, {
    slug: "fallback",
  })

  return params.length > 0 ? params : [fallbackPath]
}

interface RouteProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata(props: RouteProps) {
  const params = await props.params
  const locale = params.locale as Locale
  const slug = params.slug

  return getCaseStudyMetadata({ slug, locale })
}

export default async function CaseStudyDetailPage(props: RouteProps) {
  const params = await props.params

  return <CaseStudyView params={params} />
}
