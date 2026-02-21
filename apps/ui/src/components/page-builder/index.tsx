import type { UID } from "@repo/strapi-types"

import StrapiNewsletterForm from "@/components/page-builder/components/forms/StrapiNewsletterForm"
import StrapiNavbarComponent from "@/components/page-builder/components/navigation/StrapiNavbarComponent"
import StrapiPlanComparisonTable from "@/components/page-builder/components/plans/StrapiPlanComparisonTable"
import StrapiPlanPricingCards from "@/components/page-builder/components/plans/StrapiPlanPricingCards/StrapiPlanPricingCards"
import StrapiBannerSlice from "@/components/page-builder/components/sections/StrapiBannerSlice"
import StrapiFaqSection from "@/components/page-builder/components/sections/StrapiFaqSection"
import StrapiHowItWorks from "@/components/page-builder/components/sections/StrapiHowItWorks"
import StrapiIntegrationsSection from "@/components/page-builder/components/sections/StrapiIntegrationsSection"
import StrapiUserStoriesSection from "@/components/page-builder/components/sections/StrapiUserStoriesSection"
import { StrapiFooterCta } from "@/components/page-builder/single-types/footer/StrapiFooterCta"
import { StrapiFooterMain } from "@/components/page-builder/single-types/footer/StrapiFooterMain"

/**
 * Mapping of Strapi Component UID to React Component.
 * Used by DynamicZoneRenderer for pages, header, and footer.
 *
 * Consider improving dynamic/lazy loading of these components to reduce bundle size.
 */
export const ContentComponents: Partial<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic component map requires any for varying prop types
  Record<UID.Component, React.ComponentType<any>>
> = {
  // Forms
  "forms.newsletter-form": StrapiNewsletterForm,

  // Plans
  "plans.plan-comparison-table": StrapiPlanComparisonTable,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,

  // Sections
  "sections.banner-slice": StrapiBannerSlice,
  "sections.faq-section": StrapiFaqSection,
  "sections.how-it-works": StrapiHowItWorks,
  "sections.integrations-section": StrapiIntegrationsSection,
  "sections.user-stories-section": StrapiUserStoriesSection,

  // Footer
  "sections.footer-main": StrapiFooterMain,
  "sections.footer-cta": StrapiFooterCta,

  // Navigation
  "navigation.navbar": StrapiNavbarComponent,
}
