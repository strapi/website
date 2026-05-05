import type { Data } from "@repo/strapi-types"
import { getLocale } from "next-intl/server"
import { use } from "react"

import { searchCaseStudies } from "@/components/case-study/case-studies-search"
import { CaseStudiesGrid } from "@/components/case-study/CaseStudiesGrid"
import { Container } from "@/components/elementary/Container"

const INITIAL_PAGE_SIZE = 12

export function StrapiDynamicCaseStudiesGrid({
  component,
}: {
  readonly component: Data.Component<"sections.dynamic-case-studies-grid">
}) {
  if (component.isHidden) {
    return null
  }

  const locale = use(getLocale())
  const initial = use(
    searchCaseStudies({
      locale,
      query: "",
      categorySlugs: [],
      offset: 0,
      limit: INITIAL_PAGE_SIZE,
    })
  )

  return (
    <Container className="py-8 lg:py-12">
      <CaseStudiesGrid
        locale={locale}
        initialHits={initial.hits}
        initialTotal={initial.total}
        pageSize={INITIAL_PAGE_SIZE}
        searchAction={searchCaseStudies}
      />
    </Container>
  )
}
