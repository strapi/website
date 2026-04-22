import type { Metadata } from "next"
import type { Locale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CaseStudiesGrid } from "@/components/case-study/CaseStudiesGrid"
import { Container } from "@/components/elementary/Container"
import {
  HeroContainer,
  HeroContainerBorder,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import {
  SectionDescription,
  SectionHeader,
  SectionHeaderContainer,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { fetchCaseStudiesList } from "@/lib/strapi-api/content/server"

export const dynamic = "force-static"
export const revalidate = 14400

interface RouteProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(props: RouteProps): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "caseStudies",
  })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function UserStoriesIndexPage(props: RouteProps) {
  const { locale: localeParam } = await props.params
  const locale = localeParam as Locale

  setRequestLocale(locale)

  const [t, listRes] = await Promise.all([
    getTranslations({ locale, namespace: "caseStudies" }),
    fetchCaseStudiesList(locale),
  ])

  const items = listRes?.data ?? []

  return (
    <>
      <HeroContainer affectsNavbarTheme className="gap-0">
        <HeroContainerContent className="flex flex-col gap-10">
          <HeroContainerBorder className="animate-border-reveal">
            <Container>
              <SectionHeaderContainer>
                <SectionHeader className="animate-reveal-cascade">
                  <SectionLabel variant="default">
                    {t("sectionLabel")}
                  </SectionLabel>
                  <SectionTitle as="h1" size="lg" variant="inverse">
                    {t("title")}
                  </SectionTitle>
                  <SectionDescription variant="inverse">
                    {t("intro")}
                  </SectionDescription>
                </SectionHeader>
              </SectionHeaderContainer>
            </Container>
          </HeroContainerBorder>
        </HeroContainerContent>
      </HeroContainer>

      <Container className="py-8 lg:py-12">
        <CaseStudiesGrid items={items} />
      </Container>
    </>
  )
}
