import type { UID } from "@repo/strapi-types"

import { StrapiCaseStudyCard } from "@/components/page-builder/components/cards/StrapiCaseStudyCard"
import { StrapiContentCard } from "@/components/page-builder/components/cards/StrapiContentCard"
import { StrapiFeatureCard } from "@/components/page-builder/components/cards/StrapiFeatureCard"
import { StrapiNewsletter } from "@/components/page-builder/components/forms/strapi-newsletter"
import { StrapiBrandLogoGrid } from "@/components/page-builder/components/media/StrapiBrandLogoGrid"
import { StrapiImage } from "@/components/page-builder/components/media/StrapiImage"
import { StrapiImageGallery } from "@/components/page-builder/components/media/StrapiImageGallery"
import { StrapiNavbar } from "@/components/page-builder/components/navigation/navbar/StrapiNavbar"
import { StrapiTopBanner } from "@/components/page-builder/components/navigation/top-banner/StrapiTopBanner"
import { StrapiPlanPricingCards } from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/StrapiPlanPricingCards"
import { StrapiPlanComparisonTable } from "@/components/page-builder/components/plans/StrapiPlanComparisonTable"
import { StrapiAuthorBanner } from "@/components/page-builder/components/sections/StrapiAuthorBanner"
import { StrapiFaqSection } from "@/components/page-builder/components/sections/StrapiFaqSection"
import { StrapiHowItWorks } from "@/components/page-builder/components/sections/StrapiHowItWorks"
import { StrapiIntegrationsSection } from "@/components/page-builder/components/sections/StrapiIntegrationsSection"
import { StrapiSectionHeader } from "@/components/page-builder/components/sections/StrapiSectionHeader"
import { StrapiTwoColumnGrid } from "@/components/page-builder/components/sections/StrapiTwoColumnGrid"
import { StrapiTwoColumnsBenefits } from "@/components/page-builder/components/sections/StrapiTwoColumnsBenefits"
import { StrapiUserStoriesSection } from "@/components/page-builder/components/sections/StrapiUserStoriesSection"
import { StrapiQuote } from "@/components/page-builder/components/testimonials/strapi-quote/StrapiQuote"
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
  "sections.faq-section": StrapiFaqSection,
  "sections.how-it-works": StrapiHowItWorks,
  "sections.integrations-section": StrapiIntegrationsSection,
  "sections.section-header": StrapiSectionHeader,
  "sections.two-column-grid": StrapiTwoColumnGrid,
  "sections.two-columns-benefits": StrapiTwoColumnsBenefits,
  "sections.user-stories-section": StrapiUserStoriesSection,

  // Cards
  "cards.feature-card": StrapiFeatureCard,
  "cards.content-card": StrapiContentCard,
  "cards.case-study-card": StrapiCaseStudyCard,

  // Media
  "media.image": StrapiImage,
  "media.image-gallery": StrapiImageGallery,
  "media.brand-logo-grid": StrapiBrandLogoGrid,

  // Testimonials
  "testimonials.quote": StrapiQuote,

  // Footer
  "footer.footer-main": StrapiFooterMain,
  "footer.footer-cta": StrapiFooterCta,

  // Navigation
  "navigation.top-banner": StrapiTopBanner,
  "navigation.navbar": StrapiNavbar,
}
