import type { Schema, Struct } from "@strapi/strapi"

export interface BlogAuthorBanner extends Struct.ComponentSchema {
  collectionName: "components_blog_author_banner"
  info: {
    description: ""
    displayName: "AuthorBanner"
    icon: "user"
  }
  attributes: {
    authorAvatar: Schema.Attribute.Component<"utilities.basic-image", false>
    authorBio: Schema.Attribute.Text
    authorName: Schema.Attribute.String & Schema.Attribute.Required
    authorRole: Schema.Attribute.String
    authorUrl: Schema.Attribute.String
  }
}

export interface CardsCaseStudyCard extends Struct.ComponentSchema {
  collectionName: "components_cards_case_study_card"
  info: {
    description: ""
    displayName: "CaseStudyCard"
    icon: "star"
  }
  attributes: {
    backgroundImage: Schema.Attribute.Component<"utilities.basic-image", false>
    companyName: Schema.Attribute.String & Schema.Attribute.Required
    ctaLink: Schema.Attribute.Component<"utilities.link-text", false> &
      Schema.Attribute.Required
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    title: Schema.Attribute.Text & Schema.Attribute.Required
  }
}

export interface CardsContentCard extends Struct.ComponentSchema {
  collectionName: "components_cards_content_cards"
  info: {
    description: ""
    displayName: "ContentCard"
    icon: "file"
  }
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required
    label: Schema.Attribute.String
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface CardsFeatureCard extends Struct.ComponentSchema {
  collectionName: "components_cards_feature_card"
  info: {
    description: ""
    displayName: "FeatureCard"
    icon: "spark"
  }
  attributes: {
    ctaLinks: Schema.Attribute.Component<"utilities.link", true>
    description: Schema.Attribute.Text
    icon: Schema.Attribute.Component<"utilities.basic-image", false>
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    imagePosition: Schema.Attribute.Enumeration<["left", "right"]> &
      Schema.Attribute.DefaultTo<"right">
    layout: Schema.Attribute.Enumeration<["full", "half", "third"]> &
      Schema.Attribute.DefaultTo<"full">
    size: Schema.Attribute.Enumeration<["sm", "default", "lg"]> &
      Schema.Attribute.DefaultTo<"default">
    title: Schema.Attribute.String & Schema.Attribute.Required
    variant: Schema.Attribute.Enumeration<["plain", "bordered"]> &
      Schema.Attribute.DefaultTo<"plain">
  }
}

export interface CmsFieldEntry extends Struct.ComponentSchema {
  collectionName: "components_cms_field_entries"
  info: {
    description: ""
    displayName: "Field Entry"
    icon: "check"
  }
  attributes: {
    category: Schema.Attribute.String
    mark: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    name: Schema.Attribute.String & Schema.Attribute.Required
    text: Schema.Attribute.String
  }
}

export interface ElementsBrandLogoGridItem extends Struct.ComponentSchema {
  collectionName: "components_elements_brand_logo_grid_items"
  info: {
    displayName: "BrandLogoGridItem"
    icon: "cube"
  }
  attributes: {
    hasLink: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    image: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.Required
    link: Schema.Attribute.Component<"utilities.link", false>
    tooltip: Schema.Attribute.Component<"utilities.tooltip", false>
  }
}

export interface ElementsFooterItem extends Struct.ComponentSchema {
  collectionName: "components_elements_footer_items"
  info: {
    description: ""
    displayName: "FooterItem"
    icon: "hashtag"
  }
  attributes: {
    links: Schema.Attribute.Component<"utilities.link-text", true>
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface ElementsHeroHomeCta extends Struct.ComponentSchema {
  collectionName: "components_elements_hero_home_ctas"
  info: {
    description: ""
    displayName: "HeroHomeCta"
    icon: "code"
  }
  attributes: {
    code: Schema.Attribute.String
    cta: Schema.Attribute.Component<"utilities.link", false>
  }
}

export interface ElementsHeroHomeFeature extends Struct.ComponentSchema {
  collectionName: "components_elements_hero_home_features"
  info: {
    description: ""
    displayName: "HeroHomeFeature"
    icon: "picture"
  }
  attributes: {
    icon: Schema.Attribute.Component<"utilities.basic-image", false>
    media: Schema.Attribute.Media<"images" | "videos"> &
      Schema.Attribute.Required
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface ElementsHeroHomeTestimonials extends Struct.ComponentSchema {
  collectionName: "components_elements_hero_home_testimonials"
  info: {
    description: ""
    displayName: "HeroHomeTestimonials"
    icon: "star"
  }
  attributes: {
    logos: Schema.Attribute.Component<"utilities.basic-image", true>
    title: Schema.Attribute.String
  }
}

export interface ElementsHowItWorksItem extends Struct.ComponentSchema {
  collectionName: "components_elements_how_it_works_items"
  info: {
    description: ""
    displayName: "How It Works Item"
    icon: "lightbulb"
  }
  attributes: {
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    icon: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
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

export interface ElementsTeamMemberItem extends Struct.ComponentSchema {
  collectionName: "components_elements_team_member_items"
  info: {
    description: ""
    displayName: "TeamMemberItem"
    icon: "user"
  }
  attributes: {
    bio: Schema.Attribute.Text
    department: Schema.Attribute.String
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    location: Schema.Attribute.String
    name: Schema.Attribute.String & Schema.Attribute.Required
    role: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface ElementsTestimonyItem extends Struct.ComponentSchema {
  collectionName: "components_elements_testimony_items"
  info: {
    description: ""
    displayName: "TestimonyItem"
    icon: "play"
  }
  attributes: {
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    videoUrl: Schema.Attribute.String
  }
}

export interface FooterFooterCta extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta"
  info: {
    description: ""
    displayName: "Footer CTA"
    icon: "cursor"
  }
  attributes: {
    codeSnippet: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    ctaCards: Schema.Attribute.Component<"footer.footer-cta-card", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    featureBadges: Schema.Attribute.Component<"footer.footer-cta-badge", true> &
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

export interface FooterFooterCtaBadge extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta_badge"
  info: {
    description: ""
    displayName: "Footer CTA Badge"
    icon: "shield"
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

export interface FooterFooterCtaCard extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_cta_card"
  info: {
    description: ""
    displayName: "Footer CTA Card"
    icon: "priceTag"
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

export interface FooterFooterMain extends Struct.ComponentSchema {
  collectionName: "components_sections_footer_main"
  info: {
    description: ""
    displayName: "Footer Main"
    icon: "layout"
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

export interface FormsHubspotForm extends Struct.ComponentSchema {
  collectionName: "components_forms_hubspot_form"
  info: {
    description: ""
    displayName: "HubSpot Form"
    icon: "envelop"
  }
  attributes: {
    form: Schema.Attribute.Relation<
      "oneToOne",
      "api::hubspot-form.hubspot-form"
    >
  }
}

export interface FormsNewsletter extends Struct.ComponentSchema {
  collectionName: "components_forms_newsletter"
  info: {
    description: ""
    displayName: "Newsletter"
    icon: "paperPlane"
  }
  attributes: {
    consentText: Schema.Attribute.Text
    description: Schema.Attribute.Text
    emailPlaceholder: Schema.Attribute.String
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    submitLabel: Schema.Attribute.String
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface MediaBrandLogoGrid extends Struct.ComponentSchema {
  collectionName: "components_media_brand_logo_grids"
  info: {
    displayName: "BrandLogoGrid"
    icon: "grid"
  }
  attributes: {
    items: Schema.Attribute.Component<"elements.brand-logo-grid-item", true> &
      Schema.Attribute.Required
    title: Schema.Attribute.String
    variant: Schema.Attribute.Enumeration<["plain", "bordered"]> &
      Schema.Attribute.DefaultTo<"plain">
  }
}

export interface MediaImage extends Struct.ComponentSchema {
  collectionName: "components_media_images"
  info: {
    description: ""
    displayName: "Image"
    icon: "picture"
  }
  attributes: {
    alignment: Schema.Attribute.Enumeration<["left", "center", "right"]> &
      Schema.Attribute.DefaultTo<"center">
    image: Schema.Attribute.Component<"utilities.basic-image", false> &
      Schema.Attribute.Required
    link: Schema.Attribute.Component<"utilities.link", false>
  }
}

export interface MediaImageGallery extends Struct.ComponentSchema {
  collectionName: "components_media_image_galleries"
  info: {
    displayName: "Image Gallery"
    icon: "picture"
  }
  pluginOptions: {
    i18n: {
      localized: true
    }
  }
  attributes: {
    images: Schema.Attribute.Component<"utilities.basic-image", true> &
      Schema.Attribute.Required
    variant: Schema.Attribute.Enumeration<["contained", "full-bleed"]> &
      Schema.Attribute.DefaultTo<"contained">
  }
}

export interface MediaVideo extends Struct.ComponentSchema {
  collectionName: "components_media_videos"
  info: {
    description: ""
    displayName: "Video"
    icon: "play"
  }
  attributes: {
    alignment: Schema.Attribute.Enumeration<["left", "center", "right"]> &
      Schema.Attribute.DefaultTo<"center">
    link: Schema.Attribute.Component<"utilities.link", false>
    thumbnail: Schema.Attribute.Component<"utilities.basic-image", false>
    url: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface MigrationDataSink extends Struct.ComponentSchema {
  collectionName: "components_migration_data_sinks"
  info: {
    description: "Stores unmapped v4 component data for future re-migration"
    displayName: "Data Sink (Migration)"
    icon: "archive"
  }
  attributes: {
    data: Schema.Attribute.JSON & Schema.Attribute.Private
    sourceComponent: Schema.Attribute.String & Schema.Attribute.Private
  }
}

export interface NavbarNavItem extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_items"
  info: {
    displayName: "NavItem"
    icon: "bulletList"
  }
  attributes: {
    link: Schema.Attribute.Component<"utilities.link-text", false>
    sections: Schema.Attribute.Component<"navbar.nav-section", true>
  }
}

export interface NavbarNavLink extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_links"
  info: {
    displayName: "NavLink"
    icon: "link"
  }
  attributes: {
    description: Schema.Attribute.String
    icon: Schema.Attribute.Component<"utilities.basic-image", false>
    link: Schema.Attribute.Component<"utilities.link-text", false>
  }
}

export interface NavbarNavSection extends Struct.ComponentSchema {
  collectionName: "components_navbar_nav_sections"
  info: {
    displayName: "NavSection"
    icon: "folder"
  }
  attributes: {
    columns: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>
    items: Schema.Attribute.Component<"navbar.nav-link", true>
    title: Schema.Attribute.String
  }
}

export interface NavigationNavbar extends Struct.ComponentSchema {
  collectionName: "components_navigation_navbars"
  info: {
    description: "Main navigation bar with logo, nav items, and CTA links"
    displayName: "Navbar"
    icon: "squaresFour"
  }
  attributes: {
    bottomLinks: Schema.Attribute.Component<"utilities.link", true>
    ctaLinks: Schema.Attribute.Component<"utilities.link", true>
    githubStars: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    logoImage: Schema.Attribute.Component<"utilities.link-image", false>
    logoImageLight: Schema.Attribute.Component<"utilities.link-image", false>
    navItems: Schema.Attribute.Component<"navbar.nav-item", true>
  }
}

export interface NavigationTopBanner extends Struct.ComponentSchema {
  collectionName: "components_navigation_top_banners"
  info: {
    description: "Dismissible purple banner displayed above the navbar"
    displayName: "TopBanner"
    icon: "bell"
  }
  attributes: {
    content: Schema.Attribute.RichText
  }
}

export interface PlansPlanComparisonTable extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_comparison_tables"
  info: {
    displayName: "PlanComparisonTable"
    icon: "bulletList"
  }
  attributes: {
    footnote: Schema.Attribute.RichText
    plans: Schema.Attribute.Relation<"oneToMany", "api::plan.plan">
  }
}

export interface PlansPlanFeatureValue extends Struct.ComponentSchema {
  collectionName: "components_plans_plan_feature_values"
  info: {
    displayName: "PlanFeatureValue"
    icon: "stack"
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
    icon: "star"
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
    footnote: Schema.Attribute.RichText
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
    icon: "priceTag"
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
    icon: "key"
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

export interface SectionsFaqSection extends Struct.ComponentSchema {
  collectionName: "components_sections_faq_section"
  info: {
    description: ""
    displayName: "FAQ"
    icon: "question"
  }
  attributes: {
    items: Schema.Attribute.Component<"utilities.accordions", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
  }
}

export interface SectionsFeatureCardGrid extends Struct.ComponentSchema {
  collectionName: "components_sections_feature_card_grid"
  info: {
    description: ""
    displayName: "FeatureCardGrid"
    icon: "apps"
  }
  attributes: {
    background: Schema.Attribute.Enumeration<["none", "light"]> &
      Schema.Attribute.DefaultTo<"none">
    items: Schema.Attribute.Component<"cards.feature-card", true> &
      Schema.Attribute.Required
    section: Schema.Attribute.Component<"utilities.section-header", false>
  }
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: "components_sections_heroes"
  info: {
    description: ""
    displayName: "Hero"
    icon: "rocket"
  }
  attributes: {
    ctas: Schema.Attribute.Component<"utilities.link", true>
    description: Schema.Attribute.RichText
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    label: Schema.Attribute.String
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface SectionsHeroHome extends Struct.ComponentSchema {
  collectionName: "components_sections_hero_homes"
  info: {
    description: ""
    displayName: "HeroHome"
    icon: "house"
  }
  attributes: {
    cta: Schema.Attribute.Component<"elements.hero-home-cta", false>
    features: Schema.Attribute.Component<"elements.hero-home-feature", true>
    rotatingPhrases: Schema.Attribute.Component<"utilities.text", true>
    testimonials: Schema.Attribute.Component<
      "elements.hero-home-testimonials",
      false
    >
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface SectionsHowItWorks extends Struct.ComponentSchema {
  collectionName: "components_sections_how_it_works"
  info: {
    description: ""
    displayName: "How It Works"
    icon: "information"
  }
  attributes: {
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
    items: Schema.Attribute.Component<"elements.how-it-works-item", true> &
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
    icon: "puzzlePiece"
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

export interface SectionsMeetTheTeam extends Struct.ComponentSchema {
  collectionName: "components_sections_meet_the_teams"
  info: {
    description: ""
    displayName: "MeetTheTeam"
    icon: "grid"
  }
  attributes: {
    ctaLink: Schema.Attribute.Component<"utilities.link-text", false>
    ctaTitle: Schema.Attribute.String
    items: Schema.Attribute.Component<"elements.team-member-item", true> &
      Schema.Attribute.Required
    section: Schema.Attribute.Component<"utilities.section-header", false> &
      Schema.Attribute.Required
  }
}

export interface SectionsSectionHeader extends Struct.ComponentSchema {
  collectionName: "components_sections_section_headers"
  info: {
    displayName: "Section Header"
    icon: "layout"
  }
  attributes: {
    background: Schema.Attribute.Enumeration<["none", "light", "dark"]> &
      Schema.Attribute.DefaultTo<"none">
    boxed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    section: Schema.Attribute.Component<"utilities.section-header", false> &
      Schema.Attribute.Required
    sectionImage: Schema.Attribute.Component<"utilities.basic-image", false>
  }
}

export interface SectionsTestimonies extends Struct.ComponentSchema {
  collectionName: "components_sections_testimonies"
  info: {
    description: ""
    displayName: "Testimonies"
    icon: "slideshow"
  }
  attributes: {
    items: Schema.Attribute.Component<"elements.testimony-item", true>
  }
}

export interface SectionsTwoColumnGrid extends Struct.ComponentSchema {
  collectionName: "components_sections_two_column_grid"
  info: {
    description: ""
    displayName: "TwoColumnGrid"
    icon: "dashboard"
  }
  attributes: {
    background: Schema.Attribute.Enumeration<["none", "light"]> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }> &
      Schema.Attribute.DefaultTo<"none">
    items: Schema.Attribute.Component<"elements.how-it-works-item", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    section: Schema.Attribute.Component<"utilities.section-header", false> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    size: Schema.Attribute.Enumeration<["default", "lg"]> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }> &
      Schema.Attribute.DefaultTo<"default">
    variant: Schema.Attribute.Enumeration<["default", "purple"]> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false
        }
      }> &
      Schema.Attribute.DefaultTo<"default">
  }
}

export interface SectionsTwoColumnsBenefits extends Struct.ComponentSchema {
  collectionName: "components_sections_two_columns_benefits"
  info: {
    description: ""
    displayName: "TwoColumnsBenefits"
    icon: "grid"
  }
  attributes: {
    items: Schema.Attribute.Component<"elements.how-it-works-item", true> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true
        }
      }>
    section: Schema.Attribute.Component<"utilities.section-header", false> &
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
    icon: "user"
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
    icon: "earth"
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
    icon: "discuss"
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
    icon: "globe"
  }
  attributes: {
    socials: Schema.Attribute.Component<"utilities.link-image", true>
    title: Schema.Attribute.String
  }
}

export interface TestimonialsQuote extends Struct.ComponentSchema {
  collectionName: "components_testimonials_quote"
  info: {
    description: ""
    displayName: "Quote"
    icon: "quote"
  }
  attributes: {
    authorAvatar: Schema.Attribute.Component<"utilities.basic-image", false>
    authorName: Schema.Attribute.String & Schema.Attribute.Required
    authorRole: Schema.Attribute.String
    companyLogo: Schema.Attribute.Component<"utilities.basic-image", false>
    image: Schema.Attribute.Component<"utilities.basic-image", false>
    quote: Schema.Attribute.Text & Schema.Attribute.Required
    variant: Schema.Attribute.Enumeration<["boxed", "image"]> &
      Schema.Attribute.DefaultTo<"boxed">
  }
}

export interface UtilitiesAccordions extends Struct.ComponentSchema {
  collectionName: "components_utilities_accordions"
  info: {
    description: ""
    displayName: "Accordions"
    icon: "stack"
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
    icon: "image"
  }
  attributes: {
    alt: Schema.Attribute.String
    height: Schema.Attribute.Integer
    media: Schema.Attribute.Media<"images"> & Schema.Attribute.Required
    width: Schema.Attribute.Integer
  }
}

export interface UtilitiesLink extends Struct.ComponentSchema {
  collectionName: "components_utilities_links"
  info: {
    displayName: "Link"
    icon: "link"
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
    icon: "paintBrush"
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
    icon: "images"
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
    icon: "cursor"
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
    icon: "bulletList"
  }
  attributes: {
    links: Schema.Attribute.Component<"utilities.link", true>
    title: Schema.Attribute.String
  }
}

export interface UtilitiesSectionHeader extends Struct.ComponentSchema {
  collectionName: "components_utilities_section_headers"
  info: {
    displayName: "Section Header"
    icon: "feather"
  }
  attributes: {
    ctaLinks: Schema.Attribute.Component<"utilities.link", true>
    description: Schema.Attribute.RichText
    label: Schema.Attribute.String
    labelIcon: Schema.Attribute.Component<"utilities.basic-image", false>
    layout: Schema.Attribute.Enumeration<["left", "center", "right"]> &
      Schema.Attribute.DefaultTo<"center">
    size: Schema.Attribute.Enumeration<["xs", "sm", "default", "lg", "xl"]> &
      Schema.Attribute.DefaultTo<"default">
    title: Schema.Attribute.Text
    variant: Schema.Attribute.Enumeration<["default", "purple", "inverse"]>
  }
}

export interface UtilitiesSocialLink extends Struct.ComponentSchema {
  collectionName: "components_utilities_social_links"
  info: {
    description: ""
    displayName: "Social Link"
    icon: "link"
  }
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ["linkedin", "twitter", "github", "email", "website"]
    > &
      Schema.Attribute.Required
    url: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface UtilitiesText extends Struct.ComponentSchema {
  collectionName: "components_utilities_texts"
  info: {
    displayName: "Text"
    icon: "pencil"
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
      "blog.author-banner": BlogAuthorBanner
      "cards.case-study-card": CardsCaseStudyCard
      "cards.content-card": CardsContentCard
      "cards.feature-card": CardsFeatureCard
      "cms.field-entry": CmsFieldEntry
      "elements.brand-logo-grid-item": ElementsBrandLogoGridItem
      "elements.footer-item": ElementsFooterItem
      "elements.hero-home-cta": ElementsHeroHomeCta
      "elements.hero-home-feature": ElementsHeroHomeFeature
      "elements.hero-home-testimonials": ElementsHeroHomeTestimonials
      "elements.how-it-works-item": ElementsHowItWorksItem
      "elements.team-member-item": ElementsTeamMemberItem
      "elements.testimony-item": ElementsTestimonyItem
      "footer.footer-cta": FooterFooterCta
      "footer.footer-cta-badge": FooterFooterCtaBadge
      "footer.footer-cta-card": FooterFooterCtaCard
      "footer.footer-main": FooterFooterMain
      "footer.footer-socials": FooterFooterSocials
      "forms.hubspot-form": FormsHubspotForm
      "forms.newsletter": FormsNewsletter
      "media.brand-logo-grid": MediaBrandLogoGrid
      "media.image": MediaImage
      "media.image-gallery": MediaImageGallery
      "media.video": MediaVideo
      "migration.data-sink": MigrationDataSink
      "navbar.nav-item": NavbarNavItem
      "navbar.nav-link": NavbarNavLink
      "navbar.nav-section": NavbarNavSection
      "navigation.navbar": NavigationNavbar
      "navigation.top-banner": NavigationTopBanner
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
      "sections.faq-section": SectionsFaqSection
      "sections.feature-card-grid": SectionsFeatureCardGrid
      "sections.hero": SectionsHero
      "sections.hero-home": SectionsHeroHome
      "sections.how-it-works": SectionsHowItWorks
      "sections.integrations-section": SectionsIntegrationsSection
      "sections.meet-the-team": SectionsMeetTheTeam
      "sections.section-header": SectionsSectionHeader
      "sections.testimonies": SectionsTestimonies
      "sections.two-column-grid": SectionsTwoColumnGrid
      "sections.two-columns-benefits": SectionsTwoColumnsBenefits
      "sections.user-stories-section": SectionsUserStoriesSection
      "seo-utilities.seo": SeoUtilitiesSeo
      "seo-utilities.seo-og": SeoUtilitiesSeoOg
      "seo-utilities.seo-twitter": SeoUtilitiesSeoTwitter
      "seo-utilities.social-icons": SeoUtilitiesSocialIcons
      "testimonials.quote": TestimonialsQuote
      "utilities.accordions": UtilitiesAccordions
      "utilities.basic-image": UtilitiesBasicImage
      "utilities.link": UtilitiesLink
      "utilities.link-decorations": UtilitiesLinkDecorations
      "utilities.link-image": UtilitiesLinkImage
      "utilities.link-text": UtilitiesLinkText
      "utilities.links-with-title": UtilitiesLinksWithTitle
      "utilities.section-header": UtilitiesSectionHeader
      "utilities.social-link": UtilitiesSocialLink
      "utilities.text": UtilitiesText
      "utilities.tooltip": UtilitiesTooltip
    }
  }
}
