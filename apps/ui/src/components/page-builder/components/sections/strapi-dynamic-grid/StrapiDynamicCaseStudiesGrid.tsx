import type { Data } from "@repo/strapi-types"
import { getLocale } from "next-intl/server"
import { use } from "react"

import {
  getCaseStudyCategoryFacets,
  searchCaseStudies,
} from "@/components/case-study/case-studies-search"
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
      categoryNames: [],
      offset: 0,
      limit: INITIAL_PAGE_SIZE,
    })
  )
  const categoryOptions = use(getCaseStudyCategoryFacets())

  return (
    <Container>
      <CaseStudiesGrid
        locale={locale}
        initialHits={initial.hits}
        initialTotal={initial.total}
        categoryOptions={categoryOptions}
        pageSize={INITIAL_PAGE_SIZE}
        searchAction={searchCaseStudies}
      />
    </Container>
  )
}
