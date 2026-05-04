import type { Data } from "@repo/strapi-types"
import { getLocale } from "next-intl/server"
import { use } from "react"

import { CaseStudiesGrid } from "@/components/case-study/CaseStudiesGrid"
import { Container } from "@/components/elementary/Container"
import { fetchCaseStudiesList } from "@/lib/strapi-api/content/server"

export function StrapiDynamicCaseStudiesGrid({
  component,
}: {
  readonly component: Data.Component<"sections.dynamic-case-studies-grid">
}) {
  if (component.isHidden) {
    return null
  }

  const locale = use(getLocale())
  const listRes = use(fetchCaseStudiesList(locale))
  const items = listRes?.data ?? []

  return (
    <Container className="py-8 lg:py-12">
      <CaseStudiesGrid items={items} />
    </Container>
  )
}
