import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { Disclaimer } from "@/components/elementary/disclaimer/Disclaimer"
import { StrapiComparatorGrid } from "@/components/page-builder/components/sections/StrapiComparatorGrid"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import {
  buildComparatorWithCMS,
  mapCmsEntries,
  parseComparatorSlug,
} from "@/lib/cms-comparison-utils"
import {
  fetchAllCms,
  fetchCmsComparison,
} from "@/lib/strapi-api/content/server"

import { CmsComparisonTable } from "./CmsComparisonTable"
import {
  HeroContainer,
  HeroContainerBorder,
  HeroContainerContent,
} from "../elementary/HeroContainer"
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

  const comparison = comparisonRes?.data

  if (!comparison) {
    notFound()
  }

  const allCMS = mapCmsEntries(allCmsRes?.data ?? [])

  const comparisonSlug = comparison.slug as string
  const formatted = buildComparatorWithCMS({ slug: comparisonSlug }, allCMS)
  const slugParts = parseComparatorSlug(comparisonSlug)

  return (
    <>
      <HeroContainer affectsNavbarTheme>
        <HeroContainerContent>
          <HeroContainerBorder>
            <SectionHeaderContainer>
              <SectionHeader className="animate-reveal-cascade">
                <SectionLabel size="lg">{comparison.label}</SectionLabel>
                <SectionTitle variant="inverse" size="lg">
                  {comparison.title}
                </SectionTitle>
                <SectionDescription variant="inverse" size="lg">
                  {comparison.description}
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </HeroContainerBorder>
        </HeroContainerContent>
      </HeroContainer>

      <main className="flex w-full flex-col pt-24">
        <Container variant="condensed">
          {comparison.content && comparison.content.length > 0 && (
            <DynamicZoneRenderer
              content={comparison.content}
              itemClassName="mb-6 md:mb-10 lg:mb-14"
              surface="page"
            />
          )}
        </Container>

        {comparison.showTable && formatted && (
          <Container variant="condensed">
            <CmsComparisonTable
              firstCMS={formatted.firstCMS}
              secondCMS={formatted.secondCMS}
            />
          </Container>
        )}

        {Array.isArray(slugParts) && (
          <StrapiComparatorGrid filterBySlugs={[slugParts[0]]} />
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
