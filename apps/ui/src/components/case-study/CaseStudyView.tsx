import type { Data } from "@repo/strapi-types"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionHeaderContainer,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiSeoStructuredDataFromSeo } from "@/components/page-builder/components/seo-utilities/StrapiSeoStructuredData"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { SECTION_SPACING } from "@/lib/section-spacing"
import { fetchCaseStudy } from "@/lib/strapi-api/content/server"

interface CaseStudyViewProps {
  readonly params: {
    readonly locale: string
    readonly slug: string
  }
}

export async function CaseStudyView({ params }: CaseStudyViewProps) {
  const locale = params.locale as Locale

  setRequestLocale(locale)

  const caseStudyRes = await fetchCaseStudy(params.slug, locale)
  // Widen back to the full content-type — `fetchOneBySlug`'s inferred return
  // narrows on `populate`, but the runtime payload includes every populated
  // field (logoImage/coverImage/etc).
  const caseStudy = caseStudyRes?.data as
    | Data.ContentType<"api::case-study.case-study">
    | undefined

  if (!caseStudy) {
    notFound()
  }

  return (
    <>
      <StrapiSeoStructuredDataFromSeo seo={caseStudy.seo} />

      <SectionHeaderContainer
        background="light"
        contentClassName="items-center gap-12"
      >
        <SectionHeader className="animate-reveal-cascade">
          {caseStudy.logoImage?.image && (
            <StrapiBasicImage
              component={caseStudy.logoImage.image}
              mode="responsive"
              className="h-12 w-auto object-contain"
              sizes="200px"
              hideWhenMissing
            />
          )}

          {caseStudy.companyName && (
            <SectionLabel size="lg">{caseStudy.companyName}</SectionLabel>
          )}

          <SectionTitle as="h1" size="lg">
            {caseStudy.title}
          </SectionTitle>

          {caseStudy.description && (
            <SectionDescription size="lg">
              {caseStudy.description}
            </SectionDescription>
          )}
        </SectionHeader>

        {caseStudy.coverImage?.image && (
          <div className="animate-reveal-cascade ring-strapi-neutral-300/70 w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl ring-1">
            <StrapiBasicImage
              component={caseStudy.coverImage.image}
              mode="responsive"
              className="w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        )}
      </SectionHeaderContainer>

      <main className="flex w-full flex-col pt-4 lg:pt-8">
        <Container variant="condensed">
          {caseStudy.content && caseStudy.content.length > 0 && (
            <DynamicZoneRenderer
              content={caseStudy.content}
              itemClassName={SECTION_SPACING}
              surface="page"
            />
          )}
        </Container>
      </main>
    </>
  )
}
