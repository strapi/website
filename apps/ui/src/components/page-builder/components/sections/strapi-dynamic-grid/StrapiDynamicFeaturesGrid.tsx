import type { Data } from "@repo/strapi-types"
import { getLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { searchFeaturePages } from "@/components/feature-page/feature-pages-search"
import { FeaturePagesGrid } from "@/components/feature-page/FeaturePagesGrid"

const INITIAL_PAGE_SIZE = 12

export function StrapiDynamicFeaturesGrid({
  component,
}: {
  readonly component: Data.Component<"sections.dynamic-features-grid">
}) {
  if (component.isHidden) {
    return null
  }

  const locale = use(getLocale())
  const initial = use(
    searchFeaturePages({
      locale,
      query: "",
      offset: 0,
      limit: INITIAL_PAGE_SIZE,
    })
  )

  return (
    <Container className="py-8 lg:py-12">
      <FeaturePagesGrid
        locale={locale}
        initialHits={initial.hits}
        initialTotal={initial.total}
        pageSize={INITIAL_PAGE_SIZE}
        searchAction={searchFeaturePages}
      />
    </Container>
  )
}
