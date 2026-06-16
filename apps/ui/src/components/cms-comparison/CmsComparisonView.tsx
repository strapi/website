import type { Data } from "@repo/strapi-types"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { Disclaimer } from "@/components/elementary/disclaimer/Disclaimer"
import { StrapiComparatorGrid } from "@/components/page-builder/components/sections/StrapiComparatorGrid"
import { StrapiSeoStructuredDataFromSeo } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import {
  buildComparatorWithCMS,
  mapCmsEntries,
  parseComparatorSlug,
} from "@/lib/cms-comparison-utils"
import { SECTION_SPACING } from "@/lib/section-spacing"
import {
  fetchAllCms,
  fetchCmsComparison,
} from "@/lib/strapi-api/content/server"

import { CmsComparisonTable } from "./CmsComparisonTable"
import {
  SectionDescription,
  SectionHeader,
  SectionHeaderContainer,
  SectionLabel,
  SectionTitle,
} from "../elementary/section-header"

interface CmsComparisonViewProps {
  params: {
    locale: string
    slug: string
  }
}

export function CmsComparisonView({ params }: CmsComparisonViewProps) {
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const [comparisonRes, allCmsRes, t] = use(
    Promise.all([
      fetchCmsComparison(slug, locale),
      fetchAllCms(locale),
      getTranslations("cmsComparison"),
    ])
  )

  const comparison = comparisonRes?.data as
    | Data.ContentType<"api::cms-comparison.cms-comparison">
    | undefined

  if (!comparison) {
    notFound()
  }

  const allCMS = mapCmsEntries(allCmsRes?.data ?? [])

  const comparisonSlug = comparison.slug as string
  const formatted = buildComparatorWithCMS({ slug: comparisonSlug }, allCMS)
  const slugParts = parseComparatorSlug(comparisonSlug)

  return (
    <>
      <StrapiSeoStructuredDataFromSeo seo={comparison.seo} />
      <SectionHeaderContainer background="light">
        <SectionHeader className="animate-reveal-cascade">
          <SectionLabel size="lg">{comparison.label}</SectionLabel>
          <SectionTitle size="lg" as="h1">
            {comparison.title}
          </SectionTitle>
          <SectionDescription size="lg">
            {comparison.description}
          </SectionDescription>
        </SectionHeader>
      </SectionHeaderContainer>

      <main className="flex w-full flex-col pt-24">
        {comparison.content && comparison.content.length > 0 && (
          <DynamicZoneRenderer
            content={comparison.content}
            itemClassName={SECTION_SPACING}
            surface="page"
          />
        )}

        {Array.isArray(slugParts) && (
          <StrapiComparatorGrid filterBySlugs={[slugParts[0]]} />
        )}

        {comparison.showTable && formatted && (
          <Container variant="condensed" className={SECTION_SPACING}>
            <CmsComparisonTable
              firstCMS={formatted.firstCMS}
              secondCMS={formatted.secondCMS}
            />
          </Container>
        )}

        <Container variant="condensed">
          <Disclaimer title={t("disclaimerTitle")}>
            {t("disclaimer")}
          </Disclaimer>
        </Container>
      </main>
    </>
  )
}
