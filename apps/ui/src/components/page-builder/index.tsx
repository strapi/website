import type { UID } from "@repo/strapi-types"

import { StrapiNewsletter } from "@/components/page-builder/components/forms/strapi-newsletter"
import { StrapiNavbar } from "@/components/page-builder/components/navigation/navbar/StrapiNavbar"
import { StrapiTopBanner } from "@/components/page-builder/components/navigation/top-banner/StrapiTopBanner"
import { StrapiPlanPricingCards } from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/StrapiPlanPricingCards"
import { StrapiPlanComparisonTable } from "@/components/page-builder/components/plans/StrapiPlanComparisonTable"
import { StrapiQuote } from "@/components/page-builder/components/sections/strapi-quote/StrapiQuote"
import { StrapiAuthorBanner } from "@/components/page-builder/components/sections/StrapiAuthorBanner"
import { StrapiBrandLogoGrid } from "@/components/page-builder/components/sections/StrapiBrandLogoGrid"
import { StrapiCaseStudyCard } from "@/components/page-builder/components/sections/StrapiCaseStudyCard"
import { StrapiContentCard } from "@/components/page-builder/components/sections/StrapiContentCard"
import { StrapiFaqSection } from "@/components/page-builder/components/sections/StrapiFaqSection"
import { StrapiFeatureCard } from "@/components/page-builder/components/sections/StrapiFeatureCard"
import { StrapiHowItWorks } from "@/components/page-builder/components/sections/StrapiHowItWorks"
import { StrapiImageGallery } from "@/components/page-builder/components/sections/StrapiImageGallery"
import { StrapiIntegrationsSection } from "@/components/page-builder/components/sections/StrapiIntegrationsSection"
import { StrapiSectionHeader } from "@/components/page-builder/components/sections/StrapiSectionHeader"
import { StrapiTwoColumnGrid } from "@/components/page-builder/components/sections/StrapiTwoColumnGrid"
import { StrapiTwoColumnsBenefits } from "@/components/page-builder/components/sections/StrapiTwoColumnsBenefits"
import { StrapiUserStoriesSection } from "@/components/page-builder/components/sections/StrapiUserStoriesSection"
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
  // Plans
  "plans.plan-comparison-table": StrapiPlanComparisonTable,
  "plans.plan-pricing-cards": StrapiPlanPricingCards,

  // Forms
  "forms.newsletter": StrapiNewsletter,

  // Blog
  "blog.author-banner": StrapiAuthorBanner,

  // Sections
  "sections.brand-logo-grid": StrapiBrandLogoGrid,
  "sections.case-study-card": StrapiCaseStudyCard,
  "sections.content-card": StrapiContentCard,
  "sections.image-gallery": StrapiImageGallery,
  "sections.feature-card": StrapiFeatureCard,
  "sections.faq-section": StrapiFaqSection,
  "sections.how-it-works": StrapiHowItWorks,
  "sections.integrations-section": StrapiIntegrationsSection,
  "sections.quote": StrapiQuote,
  "sections.section-header": StrapiSectionHeader,
  "sections.two-column-grid": StrapiTwoColumnGrid,
  "sections.two-columns-benefits": StrapiTwoColumnsBenefits,
  "sections.user-stories-section": StrapiUserStoriesSection,

  // Footer
  "footer.footer-main": StrapiFooterMain,
  "footer.footer-cta": StrapiFooterCta,

  // Navigation
  "navigation.top-banner": StrapiTopBanner,
  "navigation.navbar": StrapiNavbar,
}
