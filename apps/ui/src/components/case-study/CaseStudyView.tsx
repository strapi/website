import type { Data } from "@repo/strapi-types"
import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import { Container } from "@/components/elementary/Container"
import {
  HeroContainer,
  HeroContainerBorder,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import {
  SectionDescription,
  SectionHeader,
  SectionHeaderContainer,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
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
      <HeroContainer affectsNavbarTheme>
        <HeroContainerContent>
          <HeroContainerBorder>
            <SectionHeaderContainer>
              <SectionHeader className="animate-reveal-cascade">
                {caseStudy.companyName && (
                  <SectionLabel size="lg">{caseStudy.companyName}</SectionLabel>
                )}

                <SectionTitle variant="inverse" size="lg">
                  {caseStudy.title}
                </SectionTitle>

                {caseStudy.description && (
                  <SectionDescription variant="inverse" size="lg">
                    <InlineMarkdown>{caseStudy.description}</InlineMarkdown>
                  </SectionDescription>
                )}
              </SectionHeader>

              {caseStudy.logoImage && (
                <div className="relative mt-8 h-16 w-40">
                  <StrapiBasicImage
                    component={caseStudy.logoImage}
                    mode="fill"
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
              )}
            </SectionHeaderContainer>
          </HeroContainerBorder>
        </HeroContainerContent>
      </HeroContainer>

      <main className="flex w-full flex-col pt-24">
        <Container variant="condensed">
          {caseStudy.content && caseStudy.content.length > 0 && (
            <DynamicZoneRenderer
              content={caseStudy.content}
              itemClassName="mb-6 md:mb-10 lg:mb-14"
              surface="page"
            />
          )}
        </Container>
      </main>
    </>
  )
}
