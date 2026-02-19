import type { Schema, Struct } from "@strapi/strapi"

export interface ElementsFooterItem extends Struct.ComponentSchema {
  collectionName: "components_elements_footer_items"
  info: {
    description: ""
    displayName: "FooterItem"
  }
  attributes: {
    links: Schema.Attribute.Component<"utilities.link-text", true>
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface FooterFooterSocials extends Struct.ComponentSchema {
  collectionName: "components_footer_footer_socials"
  info: {
    displayName: "FooterSocials"
    icon: "globe"
  }
  attributes: {
    socials: Schema.Attribute.Component<"utilities.link-image", true>
    title: Schema.Attribute.String
  }
}

export interface FormsContactForm extends Struct.ComponentSchema {
  collectionName: "components_forms_contact_forms"
  info: {
    displayName: "ContactForm"
  }
  attributes: {
    description: Schema.Attribute.Text
    gdpr: Schema.Attribute.Component<"utilities.link", false>
    title: Schema.Attribute.String
  }
}

export interface FormsNewsletterForm extends Struct.ComponentSchema {
  collectionName: "components_forms_newsletter_forms"
  info: {
    displayName: "Newsletter"
  }
  attributes: {
    description: Schema.Attribute.Text
    gdpr: Schema.Attribute.Component<"utilities.link", false>
    title: Schema.Attribute.String
  }
}

export interface NavbarAnnouncementBar extends Struct.ComponentSchema {
  collectionName: "components_navbar_announcement_bars"
  info: {
    displayName: "AnnouncementBar"
  }
  attributes: {
    badge: Schema.Attribute.String
    isVisible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    link: Schema.Attribute.Component<"utilities.link", false>
    text: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface NavbarNavItem extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_items"
  info: {
    displayName: "NavItem"
  }
  attributes: {
    bottomLinks: Schema.Attribute.Component<"utilities.link", true>
    directLink: Schema.Attribute.Component<"utilities.link", false>
    label: Schema.Attribute.String & Schema.Attribute.Required
    sections: Schema.Attribute.Component<"navbar.nav-section", true>
  }
}

export interface NavbarNavLink extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_links"
  info: {
    displayName: "NavLink"
  }
  attributes: {
    description: Schema.Attribute.String
    icon: Schema.Attribute.Component<"utilities.basic-image", false>
    label: Schema.Attribute.String & Schema.Attribute.Required
    link: Schema.Attribute.Component<"utilities.link", false> &
      Schema.Attribute.Required
  }
}

export interface NavbarNavSection extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_sections"
  info: {
    displayName: "NavSection"
  }
  attributes: {
    items: Schema.Attribute.Component<"navbar.nav-link", true>
    layout: Schema.Attribute.Enumeration<["list", "grid"]> &
      Schema.Attribute.DefaultTo<"list">
    title: Schema.Attribute.String
  }
}

export interface PlansPlanComparisonTable extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_comparison_tables"
  info: {
    displayName: "PlanComparisonTable"
    icon: "bulletList"
  }
  attributes: {
    footnote: Schema.Attribute.Text
    plans: Schema.Attribute.Relation<"oneToMany", "api::plan.plan">
  }
}

export interface PlansPlanFeatureValue extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_feature_values"
  info: {
    displayName: "PlanFeatureValue"
    icon: "layer"
  }
  attributes: {
    feature: Schema.Attribute.Relation<
      "oneToOne",
      "api::plan-feature.plan-feature"
    >
    mobileValue: Schema.Attribute.String
    value: Schema.Attribute.String
  }
}

export interface PlansPlanPricingCardItem extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_pricing_card_items"
  info: {
    displayName: "PlanPricingCardItem"
    icon: "shoppingCart"
  }
  attributes: {
    checkoutModal: Schema.Attribute.Component<
      "plans.pricing-card-checkout-modal",
      false
    >
    ctaMode: Schema.Attribute.Enumeration<["link", "modal"]> &
      Schema.Attribute.DefaultTo<"link">
    highlighted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    link: Schema.Attribute.Component<"utilities.link", false>
    mainFeatures: Schema.Attribute.Component<
      "plans.plan-pricing-card-item-feature",
      true
    >
    mainFeaturesTitle: Schema.Attribute.String
    plan: Schema.Attribute.Relation<"oneToOne", "api::plan.plan">
    promo: Schema.Attribute.Component<"plans.pricing-card-promo", false>
    sso: Schema.Attribute.Component<"plans.pricing-card-sso", false>
    starFeatures: Schema.Attribute.Component<
      "plans.plan-pricing-card-item-feature",
      true
    >
    starFeaturesTitle: Schema.Attribute.String
  }
}

export interface PlansPlanPricingCardItemFeature
  extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_pricing_card_item_features"
  info: {
    displayName: "PlanPricingCardItemFeature"
    icon: "bulletList"
  }
  attributes: {
    badge: Schema.Attribute.String
    badgeStyle: Schema.Attribute.Enumeration<
      [
        "default",
        "purple",
        "muted",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ]
    >
    title: Schema.Attribute.String
    tooltip: Schema.Attribute.RichText
  }
}

export interface PlansPlanPricingCards extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_pricing_cards"
  info: {
    displayName: "PlanPricingCards"
    icon: "shoppingCart"
  }
  attributes: {
    cards: Schema.Attribute.Component<"plans.plan-pricing-card-item", true>
    extraBox: Schema.Attribute.Component<"plans.plan-pricing-extra-box", false>
    switcher: Schema.Attribute.Component<"plans.pricing-switcher", false>
  }
}

export interface PlansPlanPricingExtraBox extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_pricing_extra_boxes"
  info: {
    displayName: "PlanPricingExtraBox"
    icon: "archive"
  }
  attributes: {
    description: Schema.Attribute.Text
    features: Schema.Attribute.Component<
      "plans.plan-pricing-extra-box-features",
      true
    >
    link: Schema.Attribute.Component<"utilities.link", false>
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface PlansPlanPricingExtraBoxFeatures
  extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_pricing_extra_box_features"
  info: {
    displayName: "PlanPricingExtraBoxFeatures"
    icon: "check"
  }
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required
    tooltip: Schema.Attribute.RichText
  }
}

export interface PlansPricingCardCheckoutModal extends Struct.ComponentSchema {
  collectionName: "components_plans_pricing_card_checkout_modals"
  info: {
    displayName: "PricingCardCheckoutModal"
    icon: "shoppingCart"
  }
  attributes: {
    additionalSeatMonthlyItemPriceId: Schema.Attribute.String
    additionalSeatMonthlyPrice: Schema.Attribute.String
    includedSeats: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>
    planMonthlyItemPriceId: Schema.Attribute.String
    planMonthlyPrice: Schema.Attribute.String
    ssoDefaultSelected: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>
    ssoDescription: Schema.Attribute.String
    ssoMonthlyItemPriceId: Schema.Attribute.String
    ssoMonthlyPrice: Schema.Attribute.String
    ssoMonthlyPricePerSeat: Schema.Attribute.String
  }
}

export interface PlansPricingCardPromo extends Struct.ComponentSchema {
  collectionName: "components_plans_pricing_card_promos"
  info: {
    displayName: "PricingCardPromo"
    icon: "quote"
  }
  attributes: {
    description: Schema.Attribute.Text
    subtitle: Schema.Attribute.Text
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface PlansPricingCardSso extends Struct.ComponentSchema {
  collectionName: "components_plans_pricing_card_ssos"
  info: {
    displayName: "PricingCardSSO"
    icon: "grid"
  }
  attributes: {
    description: Schema.Attribute.String
    price: Schema.Attribute.String
    subtext: Schema.Attribute.String
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface PlansPricingSwitcher extends Struct.ComponentSchema {
  collectionName: "components_plans_pricing_switchers"
  info: {
    displayName: "PricingSwitcher"
    icon: "filter"
  }
  attributes: {
    isYearlyDefault: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>
    monthlySubtitle: Schema.Attribute.String
    monthlyTitle: Schema.Attribute.String
    planTypesSwitcher: Schema.Attribute.Component<"utilities.link", true>
    showYearlyToggle: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>
    title: Schema.Attribute.String & Schema.Attribute.Required
    yearlySubtitle: Schema.Attribute.String
    yearlyTitle: Schema.Attribute.String
  }
}

export interface SectionsBannerSlice extends Struct.ComponentSchema {
  collectionName: "components_sections_banner_slice"
  info: {
    description: ""
    displayName: "Banner Slice"
  }
  attributes: {
    backgroundVariant: Schema.Attribute.Enumeration<["default", "dark"]> &
      Schema.Attribute.DefaultTo<"default">
    ctas: Schema.Attribute.Component<"utilities.link", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    heading: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    label: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFaqSection extends Struct.ComponentSchema {
  collectionName: "components_sections_faq_section"
  info: {
    description: ""
    displayName: "FAQ Section"
  }
  attributes: {
    description: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    heading: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    items: Schema.Attribute.Component<"utilities.accordions", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    sectionLabel: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFooterCta extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta"
  info: {
    description: ""
    displayName: "Footer CTA"
  }
  attributes: {
    codeSnippet: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    ctaCards: Schema.Attribute.Component<"sections.footer-cta-card", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    featureBadges: Schema.Attribute.Component<
      "sections.footer-cta-badge",
      true
    > &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    featureLogos: Schema.Attribute.Component<"utilities.basic-image", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    heading: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFooterCtaBadge extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta_badge"
  info: {
    description: ""
    displayName: "Footer CTA Badge"
  }
  attributes: {
    icon: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFooterCtaCard extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta_card"
  info: {
    description: ""
    displayName: "Footer CTA Card"
  }
  attributes: {
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    icon: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    link: Schema.Attribute.Component<"utilities.link", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFooterMain extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_main"
  info: {
    description: ""
    displayName: "Footer Main"
  }
  attributes: {
    copyRight: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    links: Schema.Attribute.Component<"utilities.link-text", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    logoImage: Schema.Attribute.Component<"utilities.link-image", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    sections: Schema.Attribute.Component<"elements.footer-item", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    socials: Schema.Attribute.Component<"footer.footer-socials", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    tagline: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsIntegrationsSection extends Struct.ComponentSchema {
  collectionName: "components_sections_integrations_section"
  info: {
    description: ""
    displayName: "Integrations Section"
  }
  attributes: {
    heading: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    label: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsUserStoriesSection extends Struct.ComponentSchema {
  collectionName: "components_sections_user_stories_section"
  info: {
    description: ""
    displayName: "User Stories Section"
  }
  attributes: {
    heading: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    label: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SeoUtilitiesSeo extends Struct.ComponentSchema {
  collectionName: "components_seo_utilities_seos"
  info: {
    description: ""
    displayName: "Seo"
    icon: "search"
  }
  attributes: {
    applicationName: Schema.Attribute.String
    canonicalUrl: Schema.Attribute.String
    keywords: Schema.Attribute.Text
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160
      }>
    metaImage: Schema.Attribute.Media<"images">
    metaRobots: Schema.Attribute.Enumeration<
      [
        "all",
        "index",
        "index,follow",
        "noindex",
        "noindex,follow",
        "noindex,nofollow",
        "none",
        "noarchive",
        "nosnippet",
        "max-snippet",
      ]
    > &
      Schema.Attribute.DefaultTo<"all">
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60
      }>
    og: Schema.Attribute.Component<"seo-utilities.seo-og", false>
    structuredData: Schema.Attribute.JSON
    twitter: Schema.Attribute.Component<"seo-utilities.seo-twitter", false>
  }
}

export interface SeoUtilitiesSeoOg extends Struct.ComponentSchema {
  collectionName: "components_seo_utilities_seo_ogs"
  info: {
    displayName: "SeoOg"
    icon: "oneToMany"
  }
  attributes: {
    description: Schema.Attribute.String
    image: Schema.Attribute.Media<"images">
    siteName: Schema.Attribute.String
    title: Schema.Attribute.String
    type: Schema.Attribute.Enumeration<["website", "article"]> &
      Schema.Attribute.DefaultTo<"website">
    url: Schema.Attribute.String
  }
}

export interface SeoUtilitiesSeoTwitter extends Struct.ComponentSchema {
  collectionName: "components_seo_utilities_seo_twitters"
  info: {
    displayName: "SeoTwitter"
    icon: "oneToMany"
  }
  attributes: {
    card: Schema.Attribute.String
    creator: Schema.Attribute.String
    creatorId: Schema.Attribute.String
    description: Schema.Attribute.String
    images: Schema.Attribute.Media<"images", true>
    siteId: Schema.Attribute.String
    title: Schema.Attribute.String
  }
}

export interface SeoUtilitiesSocialIcons extends Struct.ComponentSchema {
  collectionName: "components_seo_utilities_social_icons"
  info: {
    displayName: "SocialIcons"
  }
  attributes: {
    socials: Schema.Attribute.Component<"utilities.link-image", true>
    title: Schema.Attribute.String
  }
}

export interface UtilitiesAccordions extends Struct.ComponentSchema {
  collectionName: "components_utilities_accordions"
  info: {
    description: ""
    displayName: "Accordions"
  }
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required
    question: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface UtilitiesBasicImage extends Struct.ComponentSchema {
  collectionName: "components_utilities_basic_images"
  info: {
    displayName: "BasicImage"
  }
  attributes: {
    alt: Schema.Attribute.String
    fallbackSrc: Schema.Attribute.String
    height: Schema.Attribute.Integer
    media: Schema.Attribute.Media<"images" | "videos"> &
      Schema.Attribute.Required
    width: Schema.Attribute.Integer
  }
}

export interface UtilitiesImageWithLink extends Struct.ComponentSchema {
  collectionName: "components_utilities_image_with_links"
  info: {
    description: ""
    displayName: "ImageWithLink"
  }
  attributes: {
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    link: Schema.Attribute.Component<"utilities.link", false>
  }
}

export interface UtilitiesLink extends Struct.ComponentSchema {
  collectionName: "components_utilities_links"
  info: {
    displayName: "Link"
  }
  attributes: {
    decorations: Schema.Attribute.Component<"utilities.link-decorations", false>
    href: Schema.Attribute.String & Schema.Attribute.Required
    label: Schema.Attribute.String & Schema.Attribute.Required
    newTab: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>
    page: Schema.Attribute.Relation<"oneToOne", "api::page.page">
    type: Schema.Attribute.Enumeration<["external", "page"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"page">
  }
}

export interface UtilitiesLinkDecorations extends Struct.ComponentSchema {
  collectionName: "components_utilities_link_decorations"
  info: {
    displayName: "LinkDecorations"
  }
  attributes: {
    hasIcons: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>
    leftIcon: Schema.Attribute.Component<"utilities.basic-image", false>
    rightIcon: Schema.Attribute.Component<"utilities.basic-image", false>
    size: Schema.Attribute.Enumeration<
      ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"default">
    variant: Schema.Attribute.Enumeration<
      ["default", "destructive", "outline", "secondary", "ghost", "link"]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"link">
  }
}

export interface UtilitiesLinkImage extends Struct.ComponentSchema {
  collectionName: "components_utilities_link_images"
  info: {
    displayName: "LinkImage"
  }
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    label: Schema.Attribute.String & Schema.Attribute.Required
    newTab: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>
    page: Schema.Attribute.Relation<"oneToOne", "api::page.page">
    type: Schema.Attribute.Enumeration<["external", "page"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"page">
  }
}

export interface UtilitiesLinkText extends Struct.ComponentSchema {
  collectionName: "components_utilities_link_texts"
  info: {
    displayName: "LinkText"
  }
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required
    label: Schema.Attribute.String & Schema.Attribute.Required
    newTab: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>
    page: Schema.Attribute.Relation<"oneToOne", "api::page.page">
    type: Schema.Attribute.Enumeration<["external", "page"]> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"page">
  }
}

export interface UtilitiesLinksWithTitle extends Struct.ComponentSchema {
  collectionName: "components_utilities_links_with_titles"
  info: {
    displayName: "LinksWithTitle"
  }
  attributes: {
    links: Schema.Attribute.Component<"utilities.link", true>
    title: Schema.Attribute.String
  }
}

export interface UtilitiesText extends Struct.ComponentSchema {
  collectionName: "components_utilities_texts"
  info: {
    displayName: "Text"
  }
  attributes: {
    text: Schema.Attribute.String
  }
}

export interface UtilitiesTooltip extends Struct.ComponentSchema {
  collectionName: "components_utilities_tooltips"
  info: {
    displayName: "Tooltip"
    icon: "message"
  }
  attributes: {
    content: Schema.Attribute.RichText
  }
}

declare module "@strapi/strapi" {
  export module Public {
    export interface ComponentSchemas {
      "elements.footer-item": ElementsFooterItem
      "footer.footer-socials": FooterFooterSocials
      "forms.contact-form": FormsContactForm
      "forms.newsletter-form": FormsNewsletterForm
      "navbar.announcement-bar": NavbarAnnouncementBar
      "navbar.nav-item": NavbarNavItem
      "navbar.nav-link": NavbarNavLink
      "navbar.nav-section": NavbarNavSection
      "plans.plan-comparison-table": PlansPlanComparisonTable
      "plans.plan-feature-value": PlansPlanFeatureValue
      "plans.plan-pricing-card-item": PlansPlanPricingCardItem
      "plans.plan-pricing-card-item-feature": PlansPlanPricingCardItemFeature
      "plans.plan-pricing-cards": PlansPlanPricingCards
      "plans.plan-pricing-extra-box": PlansPlanPricingExtraBox
      "plans.plan-pricing-extra-box-features": PlansPlanPricingExtraBoxFeatures
      "plans.pricing-card-checkout-modal": PlansPricingCardCheckoutModal
      "plans.pricing-card-promo": PlansPricingCardPromo
      "plans.pricing-card-sso": PlansPricingCardSso
      "plans.pricing-switcher": PlansPricingSwitcher
      "sections.banner-slice": SectionsBannerSlice
      "sections.faq-section": SectionsFaqSection
      "sections.footer-cta": SectionsFooterCta
      "sections.footer-cta-badge": SectionsFooterCtaBadge
      "sections.footer-cta-card": SectionsFooterCtaCard
      "sections.footer-main": SectionsFooterMain
      "sections.integrations-section": SectionsIntegrationsSection
      "sections.user-stories-section": SectionsUserStoriesSection
      "seo-utilities.seo": SeoUtilitiesSeo
      "seo-utilities.seo-og": SeoUtilitiesSeoOg
      "seo-utilities.seo-twitter": SeoUtilitiesSeoTwitter
      "seo-utilities.social-icons": SeoUtilitiesSocialIcons
      "utilities.accordions": UtilitiesAccordions
      "utilities.basic-image": UtilitiesBasicImage
      "utilities.image-with-link": UtilitiesImageWithLink
      "utilities.link": UtilitiesLink
      "utilities.link-decorations": UtilitiesLinkDecorations
      "utilities.link-image": UtilitiesLinkImage
      "utilities.link-text": UtilitiesLinkText
      "utilities.links-with-title": UtilitiesLinksWithTitle
      "utilities.text": UtilitiesText
      "utilities.tooltip": UtilitiesTooltip
    }
  }
}
