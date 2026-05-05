import type { UID } from "@repo/strapi-types"

import { StrapiCallout } from "@/components/page-builder/components/blog/StrapiCallout"
import { StrapiEditorsPicks } from "@/components/page-builder/components/blog/StrapiEditorsPicks"
import { StrapiRelatedPosts } from "@/components/page-builder/components/blog/StrapiRelatedPosts"
import { StrapiResourceCta } from "@/components/page-builder/components/blog/StrapiResourceCta"
import { StrapiCaseStudyCard } from "@/components/page-builder/components/cards/StrapiCaseStudyCard"
import { StrapiContentCard } from "@/components/page-builder/components/cards/StrapiContentCard"
import { StrapiFeatureCard } from "@/components/page-builder/components/cards/StrapiFeatureCard"
import { StrapiHubSpotForm } from "@/components/page-builder/components/forms/strapi-hubspot-form/StrapiHubSpotForm"
import { StrapiHubSpotFormSsr } from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr"
import { StrapiNewsletter } from "@/components/page-builder/components/forms/strapi-newsletter"
import { StrapiBrandLogoGrid } from "@/components/page-builder/components/media/StrapiBrandLogoGrid"
import { StrapiEmbed } from "@/components/page-builder/components/media/StrapiEmbed"
import { StrapiImage } from "@/components/page-builder/components/media/StrapiImage"
import { StrapiImageGallery } from "@/components/page-builder/components/media/StrapiImageGallery"
import { StrapiVideo } from "@/components/page-builder/components/media/StrapiVideo"
import { StrapiNavbar } from "@/components/page-builder/components/navigation/navbar/StrapiNavbar"
import { StrapiTopBanner } from "@/components/page-builder/components/navigation/top-banner/StrapiTopBanner"
import { StrapiPlanPricingCards } from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/StrapiPlanPricingCards"
import { StrapiPlanComparisonTable } from "@/components/page-builder/components/plans/StrapiPlanComparisonTable"
import { StrapiCommunityBanner } from "@/components/page-builder/components/sections/strapi-community-banner/StrapiCommunityBanner"
import { StrapiConversion } from "@/components/page-builder/components/sections/strapi-conversion"
import { StrapiDemoConversion } from "@/components/page-builder/components/sections/strapi-demo-conversion"
import { StrapiDynamicCaseStudiesGrid } from "@/components/page-builder/components/sections/strapi-dynamic-grid/StrapiDynamicCaseStudiesGrid"
import { StrapiDynamicFeaturesGrid } from "@/components/page-builder/components/sections/strapi-dynamic-grid/StrapiDynamicFeaturesGrid"
import { StrapiHeroHome } from "@/components/page-builder/components/sections/strapi-hero-home/StrapiHeroHome"
import { StrapiMeetTheTeam } from "@/components/page-builder/components/sections/strapi-meet-the-team/StrapiMeetTheTeam"
import { StrapiTestimonies } from "@/components/page-builder/components/sections/strapi-testimonies/StrapiTestimonies"
import { StrapiComparatorGrid } from "@/components/page-builder/components/sections/StrapiComparatorGrid"
import { StrapiCtaBanner } from "@/components/page-builder/components/sections/StrapiCtaBanner"
import { StrapiDisclaimer } from "@/components/page-builder/components/sections/StrapiDisclaimer"
import { StrapiFaqSection } from "@/components/page-builder/components/sections/StrapiFaqSection"
import { StrapiFeatureCardGrid } from "@/components/page-builder/components/sections/StrapiFeatureCardGrid"
import { StrapiHero } from "@/components/page-builder/components/sections/StrapiHero"
import { StrapiHowItWorks } from "@/components/page-builder/components/sections/StrapiHowItWorks"
import { StrapiRichtext } from "@/components/page-builder/components/sections/StrapiRichtext"
import { StrapiSectionHeader } from "@/components/page-builder/components/sections/StrapiSectionHeader"
import { StrapiTwoColumnGrid } from "@/components/page-builder/components/sections/StrapiTwoColumnGrid"
import { StrapiTwoColumnsBenefits } from "@/components/page-builder/components/sections/StrapiTwoColumnsBenefits"
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
  "forms.hubspot-form": StrapiHubSpotForm,
  "forms.hubspot-form-ssr": StrapiHubSpotFormSsr,
  "forms.conversion": StrapiConversion,
  "forms.demo-conversion": StrapiDemoConversion,

  // Blog
  "blog.callout": StrapiCallout,
  "blog.related-posts": StrapiRelatedPosts,
  "blog.editors-picks": StrapiEditorsPicks,
  "blog.resource-cta": StrapiResourceCta,

  // Sections
  "sections.hero": StrapiHero,
  "sections.hero-home": StrapiHeroHome,
  "sections.faq-section": StrapiFaqSection,
  "sections.how-it-works": StrapiHowItWorks,
  "sections.section-header": StrapiSectionHeader,
  "sections.feature-card-grid": StrapiFeatureCardGrid,
  "sections.two-column-grid": StrapiTwoColumnGrid,
  "sections.two-columns-benefits": StrapiTwoColumnsBenefits,
  "sections.dynamic-case-studies-grid": StrapiDynamicCaseStudiesGrid,
  "sections.dynamic-features-grid": StrapiDynamicFeaturesGrid,
  // Cards
  "cards.feature-card": StrapiFeatureCard,
  "cards.content-card": StrapiContentCard,
  "cards.case-study-card": StrapiCaseStudyCard,

  // Media
  "media.image": StrapiImage,
  "media.image-gallery": StrapiImageGallery,
  "media.brand-logo-grid": StrapiBrandLogoGrid,
  "media.video": StrapiVideo,
  "media.embed": StrapiEmbed,

  // Sections (continued)
  "sections.testimonies": StrapiTestimonies,
  "sections.meet-the-team": StrapiMeetTheTeam,
  "sections.cta-banner": StrapiCtaBanner,
  "sections.community-banner": StrapiCommunityBanner,
  "sections.comparator-grid": StrapiComparatorGrid,
  "sections.disclaimer": StrapiDisclaimer,
  "sections.richtext": StrapiRichtext,

  // Testimonials
  "testimonials.quote": StrapiQuote,

  // Footer
  "footer.footer-main": StrapiFooterMain,
  "footer.footer-cta": StrapiFooterCta,

  // Navigation
  "navigation.top-banner": StrapiTopBanner,
  "navigation.navbar": StrapiNavbar,
}
