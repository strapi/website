import type { UID } from "@repo/strapi-types"

import StrapiNewsletterForm from "@/components/page-builder/components/forms/StrapiNewsletterForm"
import StrapiPlanComparisonTable from "@/components/page-builder/components/plans/StrapiPlanComparisonTable"
import StrapiPlanPricingCards from "@/components/page-builder/components/plans/StrapiPlanPricingCards/StrapiPlanPricingCards"

/**
 * Mapping of Strapi Component UID to React Component
 *
 * Consider improving dynamic/lazy loading of these components to reduce bundle size.
 */
export const PageContentComponents: Partial<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic component map requires any for varying prop types
  Record<UID.Component, React.ComponentType<any>>
> = {
  // Forms
  "forms.newsletter-form": StrapiNewsletterForm,

  // Plans
  "plans.plan-comparison-table": StrapiPlanComparisonTable,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,
}
