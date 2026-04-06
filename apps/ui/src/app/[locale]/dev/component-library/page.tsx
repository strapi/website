import type { Data } from "@repo/strapi-types"

import { BlogPostHeader } from "@/components/blog/BlogPostHeader"
import { AppLink } from "@/components/elementary/AppLink"
import { Box } from "@/components/elementary/box/Box"
import { CommandCTA } from "@/components/elementary/command-cta/CommandCTA"
import {
  FeatureCard,
  FeatureCardContent,
  FeatureCardCTA,
  FeatureCardDescription,
  FeatureCardImage,
  FeatureCardTitle,
} from "@/components/elementary/feature-card"
import { PillGroup, PillGroupItem } from "@/components/elementary/PillGroup"
import { Quote, QuoteAuthor, QuoteText } from "@/components/elementary/quote"
import {
  SectionHeader,
  SectionTitle,
  SectionDescription,
  SectionLabel,
  SectionCTA,
  SectionIcon,
  SectionHeaderContainer,
} from "@/components/elementary/section-header"
import { Spinner } from "@/components/elementary/Spinner"
import { Tooltip } from "@/components/elementary/Tooltip"
import { TriangleMask } from "@/components/elementary/TriangleMask"
import { StrapiCaseStudyCard } from "@/components/page-builder/components/cards/StrapiCaseStudyCard"
import { StrapiContentCard } from "@/components/page-builder/components/cards/StrapiContentCard"
import { StrapiHubSpotForm } from "@/components/page-builder/components/forms/strapi-hubspot-form/StrapiHubSpotForm"
import { HubSpotSsrForm } from "@/components/page-builder/components/forms/strapi-hubspot-form-ssr/HubSpotSsrForm"
import { StrapiNewsletter } from "@/components/page-builder/components/forms/strapi-newsletter"
import { StrapiBrandLogoGrid } from "@/components/page-builder/components/media/StrapiBrandLogoGrid"
import { StrapiEmbed } from "@/components/page-builder/components/media/StrapiEmbed"
import { StrapiImage } from "@/components/page-builder/components/media/StrapiImage"
import { StrapiImageGallery } from "@/components/page-builder/components/media/StrapiImageGallery"
import { StrapiVideo } from "@/components/page-builder/components/media/StrapiVideo"
import { StrapiTopBanner } from "@/components/page-builder/components/navigation/top-banner/StrapiTopBanner"
import { StrapiCommunityBanner } from "@/components/page-builder/components/sections/strapi-community-banner/StrapiCommunityBanner"
import { StrapiHeroHome } from "@/components/page-builder/components/sections/strapi-hero-home/StrapiHeroHome"
import { StrapiMeetTheTeam } from "@/components/page-builder/components/sections/strapi-meet-the-team/StrapiMeetTheTeam"
import { StrapiTestimonies } from "@/components/page-builder/components/sections/strapi-testimonies/StrapiTestimonies"
import { StrapiCtaBanner } from "@/components/page-builder/components/sections/StrapiCtaBanner"
import { StrapiFaqSection } from "@/components/page-builder/components/sections/StrapiFaqSection"
import { StrapiHero } from "@/components/page-builder/components/sections/StrapiHero"
import { StrapiHowItWorks } from "@/components/page-builder/components/sections/StrapiHowItWorks"
import { StrapiIntegrationsSection } from "@/components/page-builder/components/sections/StrapiIntegrationsSection"
import { StrapiTwoColumnGrid } from "@/components/page-builder/components/sections/StrapiTwoColumnGrid"
import { StrapiTwoColumnsBenefits } from "@/components/page-builder/components/sections/StrapiTwoColumnsBenefits"
import { StrapiUserStoriesSection } from "@/components/page-builder/components/sections/StrapiUserStoriesSection"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { HubSpotFormSchema } from "@/lib/hubspot"

// ---------------------------------------------------------------------------
// Mock image helpers
// ---------------------------------------------------------------------------

const PLACEHOLDER_IMG = "https://picsum.photos/seed/strapi/800/600"
const PLACEHOLDER_AVATAR = "https://picsum.photos/seed/avatar/200/200"
const PLACEHOLDER_LOGO = "/images/logo/strapi-monogram-logo.svg"
const PLACEHOLDER_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
const DEFAULT_MOCK_MEDIA_SIZE = { width: 800, height: 600 }

interface MockMediaOverrides {
  readonly alternativeText?: string
  readonly caption?: string
  readonly mime?: string
  readonly name?: string
}

function mockMedia(
  url: string,
  size: { width: number; height: number } = DEFAULT_MOCK_MEDIA_SIZE,
  overrides?: MockMediaOverrides
) {
  const seed = Array.from(url).reduce(
    (total, character) => total + (character.codePointAt(0) ?? 0),
    0
  )

  return {
    id: seed,
    documentId: `mock-${seed}`,
    url,
    width: size.width,
    height: size.height,
    formats: null,
    mime: overrides?.mime ?? "image/jpeg",
    alternativeText: overrides?.alternativeText,
    caption: overrides?.caption,
    name: overrides?.name,
  }
}

function mockBasicImage(
  src = PLACEHOLDER_IMG,
  alt = "Placeholder",
  size?: { width: number; height: number }
) {
  return {
    media: mockMedia(src, size),
    alt,
    ...size,
  } as Data.Component<"utilities.basic-image">
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="border-b-strapi-neutral-300 mb-6 border-b pb-2 text-2xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Variant({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-strapi-neutral-600 text-sm font-medium">{label}</p>
      {children}
    </div>
  )
}

function Placeholder({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`bg-strapi-neutral-200 flex items-center justify-center ${className ?? "h-48 w-full"}`}
    >
      <span className="text-strapi-neutral-500 text-sm">
        {children ?? "image placeholder"}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------

const TOC = [
  { id: "button", label: "Button" },
  { id: "app-link", label: "AppLink" },
  { id: "spinner", label: "Spinner" },
  { id: "pill-group", label: "PillGroup" },
  { id: "tooltip", label: "Tooltip" },
  { id: "accordion", label: "Accordion" },
  { id: "section-header", label: "SectionHeader" },
  { id: "section-header-container", label: "SectionHeaderContainer" },
  { id: "feature-card", label: "FeatureCard" },
  { id: "feature-card-grid", label: "FeatureCardGrid" },
  { id: "quote", label: "Quote" },
  { id: "newsletter-banner", label: "NewsletterBanner" },
  { id: "command-cta", label: "CommandCTA" },
  { id: "two-columns-benefits", label: "TwoColumnsBenefits" },
  { id: "two-column-grid", label: "TwoColumnGrid" },
  { id: "top-banner", label: "TopBanner" },
  { id: "content-card", label: "ContentCard" },
  { id: "box", label: "Box" },
  { id: "triangle-mask", label: "TriangleMask" },
  { id: "faq-section", label: "FaqSection" },
  { id: "how-it-works", label: "HowItWorks" },
  { id: "integrations-section", label: "IntegrationsSection" },
  { id: "user-stories-section", label: "UserStoriesSection" },
  { id: "brand-logo-grid", label: "BrandLogoGrid" },
  { id: "case-study-card", label: "CaseStudyCard" },
  { id: "image-gallery", label: "ImageGallery" },
  { id: "image", label: "Image" },
  { id: "testimonies", label: "Testimonies" },
  { id: "meet-the-team", label: "MeetTheTeam" },
  { id: "video", label: "Video" },
  { id: "hero", label: "Hero" },
  { id: "hero-home", label: "HeroHome" },
  { id: "hubspot-form", label: "HubSpot Form" },
  { id: "hubspot-form-ssr", label: "HubSpot Form (SSR)" },
  { id: "embed", label: "Embed" },
  { id: "cta-banner", label: "CtaBanner" },
  { id: "community-banner", label: "CommunityBanner" },
  { id: "blog-post-header", label: "BlogPostHeader" },
] as const

const newsletterBannerDefaultExample = {
  title: "Join our Newsletter",
  description: "Get all the latest Strapi updates, news and events.",
  emailPlaceholder: "Enter your email address",
  submitLabel: "Subscribe",
  consentText:
    "By submitting this form you consent to us emailing you occasionally about our products and services. You can unsubscribe from emails at any time, and we will never pass your email to third parties.",
} as Data.Component<"forms.newsletter">

const hubspotSsrMockSchema: HubSpotFormSchema = {
  fieldGroups: [
    {
      fields: [
        {
          name: "firstname",
          label: "First Name",
          fieldType: "single_line_text",
          required: true,
          hidden: false,
          placeholder: "John",
        },
        {
          name: "lastname",
          label: "Last Name",
          fieldType: "single_line_text",
          required: true,
          hidden: false,
          placeholder: "Doe",
        },
      ],
    },
    {
      fields: [
        {
          name: "email",
          label: "Email",
          fieldType: "email",
          required: true,
          hidden: false,
          placeholder: "john@example.com",
        },
      ],
    },
    {
      fields: [
        {
          name: "company",
          label: "Company",
          fieldType: "single_line_text",
          required: false,
          hidden: false,
          placeholder: "Acme Inc.",
        },
      ],
    },
    {
      fields: [
        {
          name: "role",
          label: "Your Role",
          fieldType: "dropdown",
          required: true,
          hidden: false,
          options: [
            { label: "Developer", value: "developer" },
            { label: "Designer", value: "designer" },
            { label: "Product Manager", value: "product_manager" },
            { label: "Other", value: "other" },
          ],
        },
      ],
    },
    {
      fields: [
        {
          name: "team_size",
          label: "Team Size",
          fieldType: "number",
          required: false,
          hidden: false,
          placeholder: "10",
          description: "Approximate number of people on your team",
        },
      ],
    },
    {
      fields: [
        {
          name: "message",
          label: "Message",
          fieldType: "multi_line_text",
          required: false,
          hidden: false,
          placeholder: "Tell us about your project...",
        },
      ],
    },
    {
      fields: [
        {
          name: "plan",
          label: "Preferred Plan",
          fieldType: "radio",
          required: true,
          hidden: false,
          options: [
            { label: "Starter", value: "starter" },
            { label: "Pro", value: "pro" },
            { label: "Enterprise", value: "enterprise" },
          ],
        },
      ],
    },
    {
      fields: [
        {
          name: "agree_terms",
          label: "I agree to the terms and conditions",
          fieldType: "single_checkbox",
          required: true,
          hidden: false,
        },
      ],
    },
  ],
  legalConsentOptions: {
    type: "explicit_consent_to_process",
    communicationConsentText:
      "<p>We'd like to send you updates about our products and services.</p>",
    communicationsCheckboxes: [
      {
        label: "I agree to receive marketing emails",
        subscriptionTypeId: 123,
      },
    ],
    consentToProcessCheckboxLabel:
      "I agree to allow Strapi to store and process my personal data.",
    privacyText:
      '<p>You can unsubscribe from these communications at any time. For more information, review our <a href="#">Privacy Policy</a>.</p>',
  },
  configuration: {
    submitButtonLabel: "Get Started",
    postSubmitAction: {
      type: "inline_message",
      value: "Thanks for your interest! We'll be in touch shortly.",
    },
  },
}

const twoColumnsBenefitsExample = {
  section: {
    title: "Deploy Your Way with Strapi",
    description:
      "Host on Strapi Cloud for an easy, fully-managed setup, or take full control with self-hosting. From prototype to production, Strapi adapts to your needs.",
    label: "Benefits",
    variant: "default",
    size: "default",
    layout: "left",
  },
  items: [
    {
      id: 1,
      title: "The Strapi Stack",
      description:
        "Enjoy a Strapi-optimized stack including a Postgres database, email provider, and CDN without having to manage it all yourself.",
    },
    {
      id: 2,
      title: "Deploy in a Few Clicks",
      description:
        "Launch your Strapi applications in minutes. Simply deploy code directly from your GitHub repositories, choose your region, and get started.",
    },
    {
      id: 3,
      title: "Customize your Stack",
      description:
        "Manage custom domains, monitor real-time logs and swap out any component of your tech stack. Stay flexible so that you're ready for anything.",
    },
  ],
} as Data.Component<"sections.two-columns-benefits">

const twoColumnGridDefaultExample = {
  section: {
    title: "Everything you need for product management",
    description:
      "From basic catalog management to complex multi-variant products, Strapi adapts to your product complexity while maintaining performance.",
    variant: "default",
    size: "default",
    layout: "center",
  },
  items: [
    {
      id: 1,
      title: "Flexible product modeling",
      description:
        "Design product structures that mirror your business logic with unlimited custom fields and relationship types.",
    },
    {
      id: 2,
      title: "Digital asset management",
      description:
        "Organize and distribute product images, videos, and documents with automated optimization and CDN delivery.",
    },
    {
      id: 3,
      title: "Bulk import & export",
      description:
        "Migrate existing catalogs seamlessly and maintain data synchronization with external systems.",
    },
    {
      id: 4,
      title: "Multi-language support",
      description:
        "Manage product information in multiple languages and locales with translation workflows.",
    },
  ],
  background: "none",
} as Data.Component<"sections.two-column-grid">

const twoColumnGridLightExample = {
  ...twoColumnGridDefaultExample,
  background: "light",
} as Data.Component<"sections.two-column-grid">

const newsletterBannerShortExample = {
  title: "Stay in the loop",
  description: "Weekly product updates for developers and content teams.",
  emailPlaceholder: "Work email",
  submitLabel: "Join now",
  consentText: "No spam. Unsubscribe any time.",
} as Data.Component<"forms.newsletter">

const topBannerDefaultExample = {
  content:
    "We just launched [Fimo.ai](https://fimo.ai/) - an AI Website Builder to create websites in minutes - [Try it now](https://fimo.ai/)",
} as Data.Component<"navigation.top-banner">

const topBannerShortExample = {
  content:
    "New feature available! Check out our [latest release](https://strapi.io)",
} as Data.Component<"navigation.top-banner">

const contentCardDefaultExample = {
  label: "Strapi vs ButterCMS",
  title: "Architecture & Hosting Flexibility",
  content:
    "Let's examine how these platforms differ in deployment options, infrastructure control, and scaling approaches – key factors that impact your team's operational autonomy and compliance requirements.\n\n| Feature | ButterCMS | Strapi |\n|---|---|---|\n| **Deployment Options** | Managed SaaS only | Self-hosted, cloud, on-premises |\n| **Infrastructure Control** | None (fully managed) | Complete control over hosting environment |\n| **Data Ownership** | Hosted on ButterCMS servers | Full data ownership and control |",
} as Data.Component<"cards.content-card">

const contentCardNoLabelExample = {
  title: "What is Strapi?",
  content:
    "Strapi is an open-source, headless CMS built on Node.js that gives developers complete control over their content architecture and deployment environment. It supports both **REST and GraphQL APIs** out of the box.\n\n- Fully customizable content types\n- Role-based access control\n- Plugin ecosystem for extensibility\n- Self-hosted or managed cloud deployment",
} as Data.Component<"cards.content-card">

const faqSectionDefaultExample = {
  items: [
    {
      id: 1,
      question: "What is Strapi?",
      answer:
        "Strapi is the leading open-source headless CMS. It's 100% JavaScript/TypeScript and fully customizable. It allows you to manage content and distribute it anywhere via APIs.",
    },
    {
      id: 2,
      question: "Is Strapi free to use?",
      answer:
        "Strapi offers a free Community Edition with all the core features. Enterprise plans are available for teams that need additional features like SSO, audit logs, and premium support.",
    },
    {
      id: 3,
      question: "Can I use Strapi with any frontend framework?",
      answer:
        "Yes! Strapi provides both REST and GraphQL APIs, so it works with any frontend — React, Vue, Angular, Next.js, Nuxt, Svelte, or even mobile apps.",
    },
  ],
} as Data.Component<"sections.faq-section">

const howItWorksDefaultExample = {
  heading: "How It Works",
  description:
    "Get started with Strapi in three simple steps and launch your content-powered application.",
  items: [
    {
      id: 1,
      title: "Design your content structure",
      description:
        "Use the Content-Type Builder to create custom content models with fields, relations, and components — no code required.",
    },
    {
      id: 2,
      title: "Add and manage content",
      description:
        "Invite your team to collaborate on content using the intuitive admin panel with role-based access control.",
    },
    {
      id: 3,
      title: "Deliver everywhere",
      description:
        "Consume your content via auto-generated REST or GraphQL APIs and deliver it to any frontend, mobile app, or IoT device.",
    },
  ],
} as Data.Component<"sections.how-it-works">

const integrationsSectionDefaultExample = {
  label: "Integrations",
  heading: "Works with your favorite tools",
} as Data.Component<"sections.integrations-section">

const userStoriesSectionDefaultExample = {
  label: "User Stories",
  heading: "See what others are building with Strapi",
} as Data.Component<"sections.user-stories-section">

const LOGO_SIZE = { width: 90, height: 45 }

const brandLogoGridPlainExample = {
  title: "Trusted by",
  variant: "plain",
  items: [
    { id: 1, image: mockBasicImage(PLACEHOLDER_LOGO, "Company 1", LOGO_SIZE) },
    { id: 2, image: mockBasicImage(PLACEHOLDER_LOGO, "Company 2", LOGO_SIZE) },
    { id: 3, image: mockBasicImage(PLACEHOLDER_LOGO, "Company 3", LOGO_SIZE) },
    { id: 4, image: mockBasicImage(PLACEHOLDER_LOGO, "Company 4", LOGO_SIZE) },
    { id: 5, image: mockBasicImage(PLACEHOLDER_LOGO, "Company 5", LOGO_SIZE) },
  ],
} as Data.Component<"media.brand-logo-grid">

const LOGO_SIZE_BORDERED = { width: 60, height: 60 }

const brandLogoGridBorderedExample = {
  title: "Our Partners",
  variant: "bordered",
  items: [
    {
      id: 1,
      image: mockBasicImage(PLACEHOLDER_LOGO, "Partner 1", LOGO_SIZE_BORDERED),
      tooltip: { content: "Strapi — Open-source headless CMS" },
    },
    {
      id: 2,
      image: mockBasicImage(PLACEHOLDER_LOGO, "Partner 2", LOGO_SIZE_BORDERED),
      tooltip: { content: "Vercel — Frontend cloud platform" },
    },
    {
      id: 3,
      image: mockBasicImage(PLACEHOLDER_LOGO, "Partner 3", LOGO_SIZE_BORDERED),
    },
    {
      id: 4,
      image: mockBasicImage(PLACEHOLDER_LOGO, "Partner 4", LOGO_SIZE_BORDERED),
    },
  ],
} as Data.Component<"media.brand-logo-grid">

const caseStudyCardDefaultExample = {
  companyName: "Tesco",
  title:
    "Tesco rationalizes application portfolio, shortens release cycles and streamlines communication across 24 channels with Strapi",
  image: mockBasicImage(PLACEHOLDER_LOGO, "Tesco logo"),
  backgroundImage: mockBasicImage(PLACEHOLDER_IMG, "Background decoration"),
  ctaLink: {
    type: "external",
    label: "Read their story",
    href: "/user-stories/tesco",
    newTab: false,
  },
} as unknown as Data.Component<"cards.case-study-card">

const imageGalleryDefaultExample = {
  images: Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    media: mockMedia(`https://picsum.photos/seed/gallery${i + 1}/800/600`),
    alt: `Gallery image ${i + 1}`,
  })),
  variant: "contained",
} as unknown as Data.Component<"media.image-gallery">

const imageGalleryFullBleedExample = {
  images: Array.from({ length: 6 }, (_, i) => ({
    id: i + 10,
    media: mockMedia(`https://picsum.photos/seed/fullbleed${i + 1}/800/600`),
    alt: `Full bleed image ${i + 1}`,
  })),
  variant: "full-bleed",
} as unknown as Data.Component<"media.image-gallery">

const imageDefaultExample = {
  image: mockBasicImage(
    "https://picsum.photos/seed/strapi-img/800/400",
    "Example image",
    { width: 800, height: 400 }
  ),
  alignment: "center",
} as Data.Component<"media.image">

const imageWithLinkExample = {
  image: mockBasicImage(
    "https://picsum.photos/seed/strapi-link-img/600/300",
    "Clickable image",
    { width: 600, height: 300 }
  ),
  link: {
    type: "external",
    label: "Visit Strapi",
    href: "https://strapi.io",
    newTab: true,
  },
  alignment: "center",
} as unknown as Data.Component<"media.image">

const imageLeftExample = {
  image: mockBasicImage(
    "https://picsum.photos/seed/strapi-left/400/300",
    "Left-aligned image",
    { width: 400, height: 300 }
  ),
  alignment: "left",
} as Data.Component<"media.image">

const imageRightExample = {
  image: mockBasicImage(
    "https://picsum.photos/seed/strapi-right/400/300",
    "Right-aligned image",
    { width: 400, height: 300 }
  ),
  alignment: "right",
} as Data.Component<"media.image">

const ctaBannerDefaultExample = {
  section: {
    title: "Submit your content",
    description:
      "Share your Strapi projects, plugins, and tutorials with the community. Get featured and inspire others to build with Strapi.",
    label: null,
    labelIcon: null,
    variant: "default",
    size: "default",
    layout: "left",
    ctaLinks: [
      {
        id: 1,
        type: "external",
        label: "Submit now",
        href: "https://strapi.io/submit",
        newTab: true,
      },
    ],
  },
  background: "dark-inverse",
  sectionImage: null,
} as Data.Component<"sections.cta-banner">

const communityBannerDefaultExample = {
  id: 1,
  title: "Join Our Amazing Community",
  description:
    "Connect with thousands of Strapi developers, share ideas, and get help from the community.",
  ctaLink: {
    id: 1,
    type: "external",
    label: "Join Discord",
    href: "https://discord.strapi.io",
    newTab: true,
  },
} as Data.Component<"sections.community-banner">

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ComponentLibraryPage() {
  return (
    <div className="space-y-16">
      <div>
        <h1 className="mb-4 text-3xl font-bold">Component Library</h1>
        <nav className="flex flex-wrap gap-2">
          {TOC.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="bg-strapi-blue-100 text-strapi-blue-700 hover:bg-strapi-blue-200 rounded-md px-3 py-1 text-sm transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Button                                                            */}
      {/* ----------------------------------------------------------------- */}
      <Section id="button" title="Button">
        <div className="space-y-6">
          <Variant label="Variants">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="purple">Purple</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </Variant>

          <Variant label="Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </Variant>

          <Variant label="States">
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading</Button>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* AppLink                                                           */}
      {/* ----------------------------------------------------------------- */}
      <Section id="app-link" title="AppLink">
        <div className="space-y-6">
          <Variant label="Variants (uses Button variants)">
            <div className="flex flex-wrap items-center gap-3">
              <AppLink href="#" variant="default">
                Default
              </AppLink>
              <AppLink href="#" variant="outline">
                Outline
              </AppLink>
              <AppLink href="#" variant="secondary">
                Secondary
              </AppLink>
              <AppLink href="#" variant="purple">
                Purple
              </AppLink>
              <AppLink href="#" variant="ghost">
                Ghost
              </AppLink>
              <AppLink href="#" variant="link">
                Link (default)
              </AppLink>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Spinner                                                           */}
      {/* ----------------------------------------------------------------- */}
      <Section id="spinner" title="Spinner">
        <div className="space-y-6">
          <Variant label="Sizes & Colors">
            <div className="flex items-center gap-12">
              <div className="rounded bg-gray-800 p-4">
                <Spinner size="sm" className="text-white" />
              </div>
              <div className="rounded bg-gray-800 p-4">
                <Spinner size="sm" className="text-white" />
              </div>
              <Spinner className="text-strapi-blue-600" />
              <Spinner size="lg" className="text-strapi-purple-500" />
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* PillGroup                                                         */}
      {/* ----------------------------------------------------------------- */}
      <Section id="pill-group" title="PillGroup">
        <Variant label="With active state">
          <PillGroup>
            <PillGroupItem active>Monthly</PillGroupItem>
            <PillGroupItem>Annual</PillGroupItem>
          </PillGroup>
        </Variant>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Tooltip                                                           */}
      {/* ----------------------------------------------------------------- */}
      <Section id="tooltip" title="Tooltip">
        <Variant label="Hover to see tooltip">
          <div className="flex gap-4">
            <Tooltip content="This is a tooltip with **markdown** support">
              <Button variant="outline">Hover me</Button>
            </Tooltip>
          </div>
        </Variant>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Accordion                                                         */}
      {/* ----------------------------------------------------------------- */}
      <Section id="accordion" title="Accordion">
        <Variant label="Default">
          <Accordion type="single" collapsible className="max-w-xl">
            <AccordionItem value="1">
              <AccordionTrigger>What is Strapi?</AccordionTrigger>
              <AccordionContent>
                Strapi is the leading open-source headless CMS. It&apos;s 100%
                JavaScript and fully customizable.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Is Strapi free?</AccordionTrigger>
              <AccordionContent>
                Strapi offers a free Community Edition and paid plans for
                enterprise features.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>
                Can I use Strapi with Next.js?
              </AccordionTrigger>
              <AccordionContent>
                Yes, Strapi works great as a headless CMS backend for Next.js
                frontends.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Variant>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* SectionHeader                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section id="section-header" title="SectionHeader">
        <div className="space-y-12">
          <Variant label="Sizes: xs / sm / default / lg / xl">
            <div className="space-y-10">
              {(["xs", "sm", "default", "lg", "xl"] as const).map((size) => (
                <div
                  key={size}
                  className="border-strapi-neutral-200 rounded-lg border p-6"
                >
                  <p className="text-strapi-neutral-500 mb-4 font-mono text-xs">
                    size=&quot;{size}&quot;
                  </p>
                  <SectionHeader size={size}>
                    <SectionLabel size={size}>Label</SectionLabel>
                    <SectionTitle size={size}>
                      Section Title at {size}
                    </SectionTitle>
                    <SectionDescription size={size}>
                      This is a description for the section header at size{" "}
                      {size}. It supports **inline markdown** formatting.
                    </SectionDescription>
                  </SectionHeader>
                </div>
              ))}
            </div>
          </Variant>

          <Variant label="Layouts: left / center / right">
            <div className="space-y-10">
              {(["left", "center", "right"] as const).map((layout) => (
                <div
                  key={layout}
                  className="border-strapi-neutral-200 rounded-lg border p-6"
                >
                  <p className="text-strapi-neutral-500 mb-4 font-mono text-xs">
                    layout=&quot;{layout}&quot;
                  </p>
                  <SectionHeader layout={layout}>
                    <SectionLabel>Label</SectionLabel>
                    <SectionTitle>Aligned {layout}</SectionTitle>
                    <SectionDescription>
                      Description text aligned to the {layout}.
                    </SectionDescription>
                    <SectionCTA layout={layout}>
                      <Button>Primary CTA</Button>
                      <Button variant="outline">Secondary</Button>
                    </SectionCTA>
                  </SectionHeader>
                </div>
              ))}
            </div>
          </Variant>

          <Variant label="SectionLabel variants: default / inverse / purple">
            <div className="flex flex-wrap gap-6">
              <SectionLabel variant="default">Default</SectionLabel>
              <div className="bg-strapi-blue-800 rounded px-4 py-2">
                <SectionLabel variant="inverse">Inverse</SectionLabel>
              </div>
              <SectionLabel variant="purple">Purple</SectionLabel>
            </div>
          </Variant>

          <Variant label="SectionTitle variants: default / inverse / purple">
            <div className="space-y-4">
              <SectionTitle size="sm">Default title</SectionTitle>
              <div className="bg-strapi-blue-800 rounded px-4 py-2">
                <SectionTitle size="sm" variant="inverse">
                  Inverse title
                </SectionTitle>
              </div>
              <SectionTitle size="sm" variant="purple">
                Purple title
              </SectionTitle>
            </div>
          </Variant>

          <Variant label="SectionIcon sizes: sm / md / lg">
            <div className="flex items-center gap-6">
              {(["sm", "md", "lg"] as const).map((size) => (
                <div key={size} className="text-center">
                  <SectionIcon size={size}>
                    <Placeholder className="size-full">{size}</Placeholder>
                  </SectionIcon>
                </div>
              ))}
            </div>
          </Variant>

          <Variant label="SectionCTA spacing: default / lg">
            <div className="space-y-6">
              <div>
                <p className="text-strapi-neutral-500 mb-2 font-mono text-xs">
                  spacing=&quot;default&quot;
                </p>
                <SectionCTA layout="left" spacing="default">
                  <Button>Primary</Button>
                  <Button variant="outline">Secondary</Button>
                </SectionCTA>
              </div>
              <div>
                <p className="text-strapi-neutral-500 mb-2 font-mono text-xs">
                  spacing=&quot;lg&quot;
                </p>
                <SectionCTA layout="left" spacing="lg">
                  <Button>Primary</Button>
                  <Button variant="outline">Secondary</Button>
                </SectionCTA>
              </div>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* SectionHeaderContainer                                            */}
      {/* ----------------------------------------------------------------- */}
      <Section id="section-header-container" title="SectionHeaderContainer">
        <div className="-mx-6 space-y-8">
          <Variant label="background: none (default)">
            <SectionHeaderContainer>
              <SectionHeader>
                <SectionLabel>Label</SectionLabel>
                <SectionTitle size="sm">No background</SectionTitle>
                <SectionDescription>
                  Default container with no background.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>

          <Variant label="background: light">
            <SectionHeaderContainer background="light">
              <SectionHeader>
                <SectionLabel>Label</SectionLabel>
                <SectionTitle size="sm">Light background</SectionTitle>
                <SectionDescription>
                  Container with light blue background.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>

          <Variant label="background: dark">
            <SectionHeaderContainer background="dark">
              <SectionHeader>
                <SectionLabel variant="inverse">Label</SectionLabel>
                <SectionTitle size="sm" variant="inverse">
                  Dark background
                </SectionTitle>
                <SectionDescription variant="inverse">
                  Container with dark background and pattern image.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>

          <Variant label="background: light + boxed">
            <SectionHeaderContainer background="light" boxed>
              <SectionHeader>
                <SectionLabel>Label</SectionLabel>
                <SectionTitle size="sm">Boxed light</SectionTitle>
                <SectionDescription>
                  Boxed container with rounded corners.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>

          <Variant label="background: dark + boxed">
            <SectionHeaderContainer background="dark" boxed>
              <SectionHeader>
                <SectionLabel variant="inverse">Label</SectionLabel>
                <SectionTitle size="sm" variant="inverse">
                  Boxed dark
                </SectionTitle>
                <SectionDescription variant="inverse">
                  Boxed container with dark background.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* FeatureCard                                                       */}
      {/* ----------------------------------------------------------------- */}
      <Section id="feature-card" title="FeatureCard">
        <div className="space-y-12">
          <Variant label='variant="plain" layout="stacked" (default)'>
            <FeatureCard variant="plain" layout="stacked">
              <FeatureCardContent>
                <FeatureCardTitle>Plain Stacked Card</FeatureCardTitle>
                <FeatureCardDescription>
                  A simple card with no border. Content stacks vertically.
                  Supports **markdown** in description.
                </FeatureCardDescription>
                <FeatureCardCTA>
                  <Button>Get Started</Button>
                  <Button variant="outline">Learn More</Button>
                </FeatureCardCTA>
              </FeatureCardContent>
            </FeatureCard>
          </Variant>

          <Variant label='variant="bordered" layout="stacked"'>
            <FeatureCard variant="bordered" layout="stacked">
              <FeatureCardContent>
                <FeatureCardTitle>Bordered Stacked Card</FeatureCardTitle>
                <FeatureCardDescription>
                  A card with blue background, border, and rounded corners.
                </FeatureCardDescription>
                <FeatureCardCTA>
                  <Button>Action</Button>
                </FeatureCardCTA>
              </FeatureCardContent>
            </FeatureCard>
          </Variant>

          <Variant label='variant="bordered" layout="split" (with image right)'>
            <FeatureCard variant="bordered" layout="split">
              <FeatureCardContent size="lg">
                <FeatureCardTitle>Split Layout</FeatureCardTitle>
                <FeatureCardDescription>
                  Two-column layout with content on the left and image on the
                  right. Uses size=&quot;lg&quot; for extra padding.
                </FeatureCardDescription>
                <FeatureCardCTA>
                  <Button>Try it out</Button>
                </FeatureCardCTA>
              </FeatureCardContent>
              <FeatureCardImage>
                <Placeholder className="h-64 w-full" />
              </FeatureCardImage>
            </FeatureCard>
          </Variant>

          <Variant label='variant="bordered" layout="split" (with image left)'>
            <FeatureCard variant="bordered" layout="split">
              <FeatureCardImage>
                <Placeholder className="h-64 w-full" />
              </FeatureCardImage>
              <FeatureCardContent size="lg">
                <FeatureCardTitle>Image on Left</FeatureCardTitle>
                <FeatureCardDescription>
                  Same split layout but with image placed before content.
                </FeatureCardDescription>
              </FeatureCardContent>
            </FeatureCard>
          </Variant>

          <Variant label="FeatureCardContent sizes: sm / default / lg">
            <div className="space-y-6">
              {(["sm", "default", "lg"] as const).map((size) => (
                <FeatureCard key={size} variant="bordered" layout="stacked">
                  <FeatureCardContent size={size}>
                    <FeatureCardTitle>Content size: {size}</FeatureCardTitle>
                    <FeatureCardDescription>
                      Padding changes with content size.
                    </FeatureCardDescription>
                  </FeatureCardContent>
                </FeatureCard>
              ))}
            </div>
          </Variant>

          <Variant label="Size variants: sm / default / lg">
            <div className="space-y-8">
              {(["sm", "default", "lg"] as const).map((size) => (
                <div
                  key={size}
                  className="border-strapi-neutral-200 rounded-lg border p-6"
                >
                  <p className="text-strapi-neutral-500 mb-4 font-mono text-xs">
                    size=&quot;{size}&quot;
                  </p>
                  <FeatureCard variant="bordered" layout="stacked" size={size}>
                    <FeatureCardContent size={size}>
                      <FeatureCardTitle size={size}>
                        Feature Card at size {size}
                      </FeatureCardTitle>
                      <FeatureCardDescription size={size}>
                        Description text scales with the size variant. Supports
                        **markdown** formatting.
                      </FeatureCardDescription>
                      <FeatureCardCTA spacing={size}>
                        <Button>Primary</Button>
                        <Button variant="outline">Secondary</Button>
                      </FeatureCardCTA>
                    </FeatureCardContent>
                  </FeatureCard>
                </div>
              ))}
            </div>
          </Variant>

          <Variant label="FeatureCardTitle">
            <div className="space-y-4">
              <FeatureCardTitle>Default title</FeatureCardTitle>
              <FeatureCardTitle as="h2">As h2</FeatureCardTitle>
              <FeatureCardTitle as="h4">As h4</FeatureCardTitle>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* FeatureCardGrid                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Section id="feature-card-grid" title="FeatureCardGrid">
        <div className="space-y-12">
          <Variant label="3-column grid (icon top)">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {["Content Modeling", "API Generation", "Media Library"].map(
                (title) => (
                  <FeatureCard
                    key={title}
                    variant="bordered"
                    layout="stacked"
                    size="sm"
                  >
                    <FeatureCardContent size="sm">
                      <FeatureCardTitle
                        size="sm"
                        iconPosition="top"
                        icon={<Placeholder className="size-10" />}
                      >
                        {title}
                      </FeatureCardTitle>
                      <FeatureCardDescription size="sm">
                        A short description of this feature and what it enables
                        for the user.
                      </FeatureCardDescription>
                    </FeatureCardContent>
                  </FeatureCard>
                )
              )}
            </div>
          </Variant>

          <Variant label="2-column grid (icon inline)">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {["Customizable Admin", "Role-Based Access"].map((title) => (
                <FeatureCard
                  key={title}
                  variant="bordered"
                  layout="stacked"
                  size="sm"
                >
                  <FeatureCardContent size="sm">
                    <FeatureCardTitle
                      size="sm"
                      iconPosition="inline"
                      icon={<Placeholder className="size-10" />}
                    >
                      {title}
                    </FeatureCardTitle>
                    <FeatureCardDescription size="sm">
                      A longer description with more details about the feature.
                      Supports **markdown** formatting for emphasis.
                    </FeatureCardDescription>
                    <FeatureCardCTA spacing="sm">
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                    </FeatureCardCTA>
                  </FeatureCardContent>
                </FeatureCard>
              ))}
            </div>
          </Variant>

          <Variant label="3-column grid on light background">
            <Box variant="light" className="rounded-lg p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  "Deploy",
                  "Scale",
                  "Monitor",
                  "Secure",
                  "Integrate",
                  "Extend",
                ].map((title) => (
                  <FeatureCard
                    key={title}
                    variant="plain"
                    layout="stacked"
                    size="sm"
                  >
                    <FeatureCardContent size="sm">
                      <FeatureCardTitle
                        size="sm"
                        iconPosition="top"
                        icon={<Placeholder className="size-10" />}
                      >
                        {title}
                      </FeatureCardTitle>
                      <FeatureCardDescription size="sm">
                        Feature description text.
                      </FeatureCardDescription>
                    </FeatureCardContent>
                  </FeatureCard>
                ))}
              </div>
            </Box>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Quote                                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section id="quote" title="Quote">
        <div className="space-y-12">
          <Variant label='size="default"'>
            <div className="max-w-2xl">
              <Quote size="default">
                <QuoteText>
                  Strapi has been a game-changer for our team. The flexibility
                  and ease of use is **unmatched** by any other CMS.
                </QuoteText>
                <QuoteAuthor name="Jane Doe" role="CTO at Acme Corp" />
              </Quote>
            </div>
          </Variant>

          <Variant label='size="lg"'>
            <div className="max-w-3xl">
              <Quote size="lg">
                <QuoteText size="lg">
                  We moved our entire content infrastructure to Strapi in under
                  a month. The developer experience is **incredible**.
                </QuoteText>
                <QuoteAuthor
                  name="John Smith"
                  role="Lead Engineer at StartupX"
                />
              </Quote>
            </div>
          </Variant>

          <Variant label="QuoteAuthor with avatar placeholder">
            <QuoteAuthor
              name="Sarah Connor"
              role="VP of Engineering"
              avatar={
                <div className="bg-strapi-purple-300 flex size-full items-center justify-center text-xs text-white">
                  SC
                </div>
              }
              logo={
                <div className="bg-strapi-neutral-200 flex h-5 items-center rounded px-3 text-xs">
                  Logo
                </div>
              }
            />
          </Variant>

          <Variant label="Boxed quote pattern (as used in StrapiQuote boxed variant)">
            <div className="max-w-3xl rounded-xl bg-white p-10 shadow-lg">
              <Quote>
                <QuoteText>
                  The API-first approach lets us deliver content everywhere —
                  web, mobile, and IoT devices — all from a **single source of
                  truth**.
                </QuoteText>
                <QuoteAuthor
                  name="Alex Rivera"
                  role="Product Lead"
                  avatar={
                    <div className="bg-strapi-blue-400 flex size-full items-center justify-center text-xs text-white">
                      AR
                    </div>
                  }
                />
              </Quote>
            </div>
          </Variant>

          <Variant label="Image quote pattern (as used in StrapiQuote image variant)">
            <div className="bg-strapi-blue-100 relative overflow-hidden rounded-xl p-10">
              <div className="relative z-10 flex flex-col gap-12 lg:flex-row lg:items-center">
                <Placeholder className="aspect-square w-64 shrink-0 rounded-lg" />
                <Quote size="lg">
                  <QuoteText size="lg">
                    Strapi gave us the tools to build a truly custom content
                    experience without compromising on performance.
                  </QuoteText>
                  <QuoteAuthor
                    name="Maria Chen"
                    role="Engineering Manager"
                    avatar={
                      <div className="bg-strapi-purple-400 flex size-full items-center justify-center text-xs text-white">
                        MC
                      </div>
                    }
                  />
                </Quote>
              </div>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* NewsletterBanner                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Section id="newsletter-banner" title="NewsletterBanner">
        <div className="space-y-10">
          <Variant label="Default example (matches copied strapi.io section)">
            <div className="-mx-6">
              <StrapiNewsletter component={newsletterBannerDefaultExample} />
            </div>
          </Variant>

          <Variant label="Short content example">
            <div className="-mx-6">
              <StrapiNewsletter component={newsletterBannerShortExample} />
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* TwoColumnsBenefits                                               */}
      {/* ----------------------------------------------------------------- */}
      <Section id="two-columns-benefits" title="TwoColumnsBenefits">
        <div className="-mx-6 space-y-6">
          <Variant label="Default (left-aligned header + benefit items)">
            <StrapiTwoColumnsBenefits component={twoColumnsBenefitsExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* TwoColumnGrid                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section id="two-column-grid" title="TwoColumnGrid">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (no background)">
            <StrapiTwoColumnGrid component={twoColumnGridDefaultExample} />
          </Variant>

          <Variant label="Light background">
            <StrapiTwoColumnGrid component={twoColumnGridLightExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* TopBanner                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Section id="top-banner" title="TopBanner">
        <div className="-mx-6 space-y-6">
          <Variant label="Default (with markdown links)">
            <StrapiTopBanner component={topBannerDefaultExample} />
          </Variant>

          <Variant label="Short content">
            <StrapiTopBanner component={topBannerShortExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* ContentCard                                                       */}
      {/* ----------------------------------------------------------------- */}
      <Section id="content-card" title="ContentCard">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (with label, title, and rich markdown content)">
            <StrapiContentCard component={contentCardDefaultExample} />
          </Variant>

          <Variant label="Without label">
            <StrapiContentCard component={contentCardNoLabelExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* CommandCTA                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Section id="command-cta" title="CommandCTA">
        <div className="space-y-12">
          <Variant label="Default (with code snippet)">
            <div className="max-w-sm">
              <CommandCTA
                title="Get Started"
                description="Simply copy and paste the following command line in your terminal to create your first Strapi project."
                codeSnippet="npx create-strapi-app my-project --quickstart"
              />
            </div>
          </Variant>

          <Variant label="Custom CTA label">
            <div className="max-w-sm">
              <CommandCTA
                title="Install the CLI"
                description="Get started with the Strapi CLI in seconds."
                codeSnippet="npm install -g strapi"
                ctaLabel="Copy to clipboard"
              />
            </div>
          </Variant>

          <Variant label="Without code snippet (title + description only)">
            <div className="max-w-sm">
              <CommandCTA
                title="Editor's Pick"
                description="Check out our latest article on building headless CMS applications with Strapi and Next.js."
              />
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Box                                                               */}
      {/* ----------------------------------------------------------------- */}
      <Section id="box" title="Box">
        <div className="space-y-6">
          <Variant label="All variants">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {(["none", "light", "dark"] as const).map((variant) => (
                <Box key={variant} variant={variant} className="rounded-lg p-8">
                  <p
                    className={`relative z-10 text-center text-sm font-medium ${
                      variant === "dark"
                        ? "text-white"
                        : "text-strapi-neutral-800"
                    }`}
                  >
                    {variant}
                  </p>
                </Box>
              ))}
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* TriangleMask                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Section id="triangle-mask" title="TriangleMask">
        <div className="space-y-6">
          <Variant label="With image content">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {(
                [
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ] as const
              ).map((position) => (
                <div key={position} className="aspect-square w-full">
                  <TriangleMask position={position}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://picsum.photos/seed/triangle/400/400"
                      alt={`Triangle mask ${position}`}
                      className="size-full object-cover"
                    />
                  </TriangleMask>
                </div>
              ))}
            </div>
          </Variant>

          <Variant label="Layered triangle masks (background + offset overlay)">
            <div className="relative size-120">
              <TriangleMask position="bottom-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://picsum.photos/seed/layered/600/600"
                  alt="Triangle mask bottom-left"
                  className="size-full object-cover"
                />
              </TriangleMask>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* FaqSection                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Section id="faq-section" title="FaqSection">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (with label, heading, description, and 3 items)">
            <StrapiFaqSection component={faqSectionDefaultExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* HowItWorks                                                        */}
      {/* ----------------------------------------------------------------- */}
      <Section id="how-it-works" title="HowItWorks">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (3 steps, no icons)">
            <StrapiHowItWorks component={howItWorksDefaultExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* IntegrationsSection                                               */}
      {/* ----------------------------------------------------------------- */}
      <Section id="integrations-section" title="IntegrationsSection">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (with built-in mock integrations)">
            <StrapiIntegrationsSection
              component={integrationsSectionDefaultExample}
            />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* UserStoriesSection                                                */}
      {/* ----------------------------------------------------------------- */}
      <Section id="user-stories-section" title="UserStoriesSection">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (with built-in mock stories)">
            <StrapiUserStoriesSection
              component={userStoriesSectionDefaultExample}
            />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* BrandLogoGrid                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section id="brand-logo-grid" title="BrandLogoGrid">
        <div className="-mx-6 space-y-10">
          <Variant label='variant="plain" (logos with opacity hover effect)'>
            <StrapiBrandLogoGrid component={brandLogoGridPlainExample} />
          </Variant>

          <Variant label='variant="bordered" (logos with border boxes)'>
            <StrapiBrandLogoGrid component={brandLogoGridBorderedExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* CaseStudyCard                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Section id="case-study-card" title="CaseStudyCard">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (clickable card with CTA)">
            <StrapiCaseStudyCard component={caseStudyCardDefaultExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* ImageGallery                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Section id="image-gallery" title="ImageGallery">
        <div className="-mx-6 space-y-10">
          <Variant label='variant="contained" (8 images, alternating 7/5 grid)'>
            <StrapiImageGallery component={imageGalleryDefaultExample} />
          </Variant>

          <Variant label='variant="full-bleed" (6 images, edge-to-edge)'>
            <StrapiImageGallery component={imageGalleryFullBleedExample} />
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Image                                                             */}
      {/* ----------------------------------------------------------------- */}
      <Section id="image" title="Image">
        <div className="-mx-6 space-y-10">
          <Variant label='alignment="center" (default)'>
            <StrapiImage component={imageDefaultExample} />
          </Variant>

          <Variant label='alignment="left"'>
            <StrapiImage component={imageLeftExample} />
          </Variant>

          <Variant label='alignment="right"'>
            <StrapiImage component={imageRightExample} />
          </Variant>

          <Variant label="With link (clickable image)">
            <StrapiImage component={imageWithLinkExample} />
          </Variant>
        </div>
      </Section>

      <Section id="testimonies" title="Testimonies">
        <div className="-mx-6 space-y-10">
          <Variant label="3 items (wraps to 2+1)">
            <StrapiTestimonies
              component={
                {
                  id: 100,
                  __component: "sections.testimonies",
                  items: [
                    {
                      id: 1,
                      image: mockBasicImage(
                        "https://picsum.photos/seed/testimony1/590/332",
                        "Team member 1"
                      ),
                      videoUrl: "https://youtu.be/example1",
                    },
                    {
                      id: 2,
                      image: mockBasicImage(
                        "https://picsum.photos/seed/testimony2/590/332",
                        "Team member 2"
                      ),
                      videoUrl: "https://youtu.be/example2",
                    },
                    {
                      id: 3,
                      image: mockBasicImage(
                        "https://picsum.photos/seed/testimony3/590/332",
                        "Team member 3"
                      ),
                      videoUrl: "https://youtu.be/example3",
                    },
                  ],
                } as Data.Component<"sections.testimonies">
              }
            />
          </Variant>

          <Variant label="2 items (centered)">
            <StrapiTestimonies
              component={
                {
                  id: 101,
                  __component: "sections.testimonies",
                  items: [
                    {
                      id: 1,
                      image: mockBasicImage(
                        "https://picsum.photos/seed/testimony4/590/332",
                        "Team member 1"
                      ),
                      videoUrl: "https://youtu.be/example4",
                    },
                    {
                      id: 2,
                      image: mockBasicImage(
                        "https://picsum.photos/seed/testimony5/590/332",
                        "Team member 2"
                      ),
                      videoUrl: "https://youtu.be/example5",
                    },
                  ],
                } as Data.Component<"sections.testimonies">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="meet-the-team" title="MeetTheTeam">
        <div className="-mx-6 space-y-10">
          <Variant label="Default with filter">
            <StrapiMeetTheTeam
              component={
                {
                  id: 200,
                  __component: "sections.meet-the-team",
                  section: {
                    id: 1,
                    title: "Meet the team",
                    description: null,
                    label: null,
                    labelIcon: null,
                    variant: "default",
                    size: "default",
                    layout: "center",
                    ctaLinks: [],
                  },
                  items: [
                    {
                      id: 1,
                      name: "Pierre Burgy",
                      role: "Chief Executive Officer",
                      department: "Leadership",
                      location: "Paris",
                      bio: "Pierre created Strapi with Aurélien and Jim back in 2015. He's a strong believer in open-source, remote and people-first organizations. You can also find him regularly windsurfing or mountain-biking!",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team1/241/286",
                        "Pierre Burgy"
                      ),
                    },
                    {
                      id: 2,
                      name: "Aurélien Georget",
                      role: "Chief Product Officer",
                      department: "Leadership",
                      location: "Paris",
                      bio: "Aurélien co-founded Strapi and leads the product vision. Passionate about developer experience and open-source communities.",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team2/241/286",
                        "Aurélien Georget"
                      ),
                    },
                    {
                      id: 3,
                      name: "Alexandre Bodin",
                      role: "Chief Technical Officer",
                      department: "Leadership",
                      location: "Paris",
                      bio: "Alexandre is the technical mastermind behind Strapi's architecture. When not coding, he enjoys hiking in the French Alps.",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team3/241/286",
                        "Alexandre Bodin"
                      ),
                    },
                    {
                      id: 4,
                      name: "Hicham E.",
                      role: "Lead Front-End Engineer",
                      department: "Engineering",
                      location: "Remote",
                      bio: "Hicham leads the front-end team and is passionate about building performant, accessible user interfaces.",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team4/241/286",
                        "Hicham E."
                      ),
                    },
                    {
                      id: 5,
                      name: "Victor Coisne",
                      role: "VP Marketing",
                      department: "Marketing",
                      location: "Paris",
                      bio: "Victor drives Strapi's marketing strategy and community growth. A firm believer in the power of developer communities.",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team5/241/286",
                        "Victor Coisne"
                      ),
                    },
                    {
                      id: 6,
                      name: "Emilie R.",
                      role: "Head of Product",
                      department: "Product",
                      location: "Lyon",
                      bio: "Emilie shapes the product roadmap and ensures Strapi meets the needs of its diverse user base.",
                      image: mockBasicImage(
                        "https://picsum.photos/seed/team6/241/286",
                        "Emilie R."
                      ),
                    },
                  ],
                  ctaTitle: "Wish to see your photo here?",
                  ctaLink: {
                    id: 1,
                    type: "external",
                    label: "See Open Positions",
                    newTab: true,
                    href: "https://jobs.lever.co/strapi/",
                  },
                } as Data.Component<"sections.meet-the-team">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="video" title="Video">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (YouTube embed, no thumbnail)">
            <StrapiVideo
              component={
                {
                  id: 300,
                  __component: "media.video",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  thumbnail: null,
                  link: null,
                  alignment: "center",
                } as Data.Component<"media.video">
              }
            />
          </Variant>

          <Variant label="With thumbnail poster">
            <StrapiVideo
              component={
                {
                  id: 301,
                  __component: "media.video",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  thumbnail: mockBasicImage(
                    "https://picsum.photos/seed/video-thumb/1280/720",
                    "Video thumbnail"
                  ),
                  link: null,
                  alignment: "center",
                } as Data.Component<"media.video">
              }
            />
          </Variant>

          <Variant label="Left-aligned">
            <StrapiVideo
              component={
                {
                  id: 302,
                  __component: "media.video",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  thumbnail: null,
                  link: null,
                  alignment: "left",
                } as Data.Component<"media.video">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="hero" title="Hero">
        <div className="space-y-6">
          <Variant label="Product launch">
            <StrapiHero
              component={
                {
                  id: 400,
                  __component: "sections.hero",
                  label: "Composable Content Platform",
                  title:
                    "Launch campaign pages and product docs without slowing engineering down.",
                  description:
                    "Give marketing, product, and regional teams a shared workspace for shipping **localized pages**, **structured content**, and **reusable sections** on the same release cadence.",
                  ctas: [
                    {
                      id: 401,
                      type: "external",
                      label: "Explore Platform",
                      href: "/product",
                      newTab: false,
                      page: null,
                      decorations: {
                        id: 501,
                        variant: "default",
                        size: "lg",
                        hasIcons: false,
                        leftIcon: null,
                        rightIcon: null,
                      },
                    },
                    {
                      id: 402,
                      type: "external",
                      label: "Book a Demo",
                      href: "/contact",
                      newTab: false,
                      page: null,
                      decorations: {
                        id: 502,
                        variant: "outline",
                        size: "lg",
                        hasIcons: false,
                        leftIcon: null,
                        rightIcon: null,
                      },
                    },
                  ],
                  image: mockBasicImage(
                    "https://picsum.photos/seed/platform-launch/1200/600",
                    "Team reviewing launch metrics on a dashboard"
                  ),
                } as Data.Component<"sections.hero">
              }
            />
          </Variant>

          <Variant label="Editorial focus">
            <StrapiHero
              component={
                {
                  id: 403,
                  __component: "sections.hero",
                  title:
                    "Turn long approval cycles into a clean publishing workflow.",
                  description:
                    "Model content once, route it through review, and let teams publish to web, app, and email from the same source of truth.",
                  label: "For content teams",
                  ctas: [],
                  image: null,
                } as Data.Component<"sections.hero">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="hero-home" title="HeroHome">
        <div className="space-y-6">
          <Variant label="CLI + social proof">
            <StrapiHeroHome
              component={
                {
                  id: 410,
                  __component: "sections.hero-home",
                  title:
                    "Build your content stack in minutes, then scale it across every channel.",
                  cta: {
                    id: 411,
                    code: "pnpm create strapi-app",
                    cta: {
                      id: 412,
                      type: "external",
                      label: "Start Free",
                      href: "/cloud",
                      newTab: false,
                      page: null,
                      decorations: {
                        id: 413,
                        variant: "default",
                        size: "lg",
                        hasIcons: false,
                        leftIcon: null,
                        rightIcon: null,
                      },
                    },
                  },
                  rotatingPhrases: [
                    { id: 7001, text: "Websites" },
                    { id: 7002, text: "Web Apps" },
                    { id: 7003, text: "Mobile Apps" },
                    { id: 7004, text: "Intranets" },
                    { id: 7005, text: "LMS" },
                  ],
                  testimonials: {
                    id: 414,
                    title:
                      "Chosen by teams shipping product, commerce, and documentation at scale",
                    logos: [
                      mockBasicImage(PLACEHOLDER_LOGO, "Acme"),
                      mockBasicImage(PLACEHOLDER_LOGO, "Northstar"),
                      mockBasicImage(PLACEHOLDER_LOGO, "Helio"),
                      mockBasicImage(PLACEHOLDER_LOGO, "Pioneer"),
                      mockBasicImage(PLACEHOLDER_LOGO, "Vertex"),
                      mockBasicImage(PLACEHOLDER_LOGO, "Beacon"),
                    ],
                  },
                  features: [
                    {
                      id: 415,
                      title: "Create APIs",
                      icon: mockBasicImage(PLACEHOLDER_LOGO, "Create APIs", {
                        width: 40,
                        height: 40,
                      }),
                      media: mockMedia(
                        "https://picsum.photos/seed/hero-feature-1/1280/720",
                        { width: 1280, height: 720 },
                        {
                          alternativeText: "Create APIs feature preview",
                        }
                      ),
                    },
                    {
                      id: 416,
                      title: "Content Management",
                      icon: mockBasicImage(
                        PLACEHOLDER_LOGO,
                        "Content Management",
                        { width: 40, height: 40 }
                      ),
                      media: mockMedia(
                        PLACEHOLDER_VIDEO,
                        { width: 1280, height: 720 },
                        {
                          mime: "video/mp4",
                          name: "flower.mp4",
                        }
                      ),
                    },
                    {
                      id: 417,
                      title: "Customization",
                      icon: mockBasicImage(PLACEHOLDER_LOGO, "Customization", {
                        width: 40,
                        height: 40,
                      }),
                      media: mockMedia(
                        "https://picsum.photos/seed/hero-feature-3/1280/720",
                        { width: 1280, height: 720 },
                        {
                          alternativeText: "Customization feature preview",
                        }
                      ),
                    },
                  ],
                } as Data.Component<"sections.hero-home">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="hubspot-form" title="HubSpot Form">
        <div className="-mx-6 space-y-10">
          <Variant label="Live embed">
            <StrapiHubSpotForm
              component={
                {
                  id: 900,
                  __component: "forms.hubspot-form",
                  form: {
                    id: 901,
                    documentId: "component-library-demo-form",
                    name: "Component Library Demo Form",
                    portalId: "6893032",
                    formId: "d3fe1d5f-9812-4046-81ed-4dd913373f2f",
                    placeholderHeight: 620,
                  },
                } as Data.Component<"forms.hubspot-form">
              }
            />
          </Variant>
          <Variant label="Compact placeholder">
            <StrapiHubSpotForm
              component={
                {
                  id: 902,
                  __component: "forms.hubspot-form",
                  form: {
                    id: 903,
                    documentId: "component-library-demo-form-compact",
                    name: "Component Library Demo Form Compact",
                    portalId: "6893032",
                    formId: "d3fe1d5f-9812-4046-81ed-4dd913373f2f",
                    placeholderHeight: 420,
                  },
                } as Data.Component<"forms.hubspot-form">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="hubspot-form-ssr" title="HubSpot Form (SSR)">
        <p className="text-strapi-neutral-600 mb-6 text-sm">
          Server-side rendered HubSpot form using shadcn/ui + react-hook-form +
          zod. Renders native form controls instead of an embedded iframe.
          Submission is disabled in this demo (no API route connected).
        </p>
        <div className="-mx-6 space-y-10">
          <Variant label="All field types">
            <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
              <HubSpotSsrForm
                schema={hubspotSsrMockSchema}
                portalId="demo-portal"
                formId="demo-form"
              />
            </div>
          </Variant>

          <Variant label="Error: Schema fetch failure">
            <div className="mx-auto max-w-xl">
              <Alert variant="destructive">
                <AlertTitle>Form unavailable</AlertTitle>
                <AlertDescription>
                  This form could not be loaded. Please try again later.
                  <p className="mt-1 text-xs">
                    Failed to fetch HubSpot form schema (status=401)
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </Variant>

          <Variant label="Error: Empty form (no visible fields)">
            <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
              <HubSpotSsrForm
                schema={{
                  fieldGroups: [
                    {
                      fields: [
                        {
                          name: "hidden_field",
                          label: "Hidden",
                          fieldType: "single_line_text",
                          required: false,
                          hidden: true,
                        },
                      ],
                    },
                  ],
                }}
                portalId="demo-portal"
                formId="demo-form-empty"
              />
            </div>
          </Variant>

          <Variant label="Error: Submission failure">
            <div className="rounded-strapi-lg mx-auto max-w-xl bg-white p-8 shadow-lg lg:p-12">
              <Alert variant="destructive">
                <AlertTitle>Submission failed</AlertTitle>
                <AlertDescription>
                  Form submission failed. Please try again.
                </AlertDescription>
              </Alert>
            </div>
          </Variant>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Embed                                                              */}
      {/* ----------------------------------------------------------------- */}
      <Section id="embed" title="Embed">
        <div className="space-y-6">
          <Variant label="Default (Guideflow demo)">
            <StrapiEmbed
              component={
                {
                  id: 1,
                  __component: "media.embed",
                  url: "https://app.guideflow.com/embed/np15xl7uzk",
                  width: 1000,
                  height: 670,
                } as Data.Component<"media.embed">
              }
            />
          </Variant>

          <Variant label="YouTube video (16:9)">
            <StrapiEmbed
              component={
                {
                  id: 2,
                  __component: "media.embed",
                  url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                  width: 1280,
                  height: 720,
                } as Data.Component<"media.embed">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="cta-banner" title="CtaBanner">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (dark-inverse, no image)">
            <StrapiCtaBanner component={ctaBannerDefaultExample} />
          </Variant>

          <Variant label="Dark variant">
            <StrapiCtaBanner
              component={
                {
                  ...ctaBannerDefaultExample,
                  background: "dark",
                } as Data.Component<"sections.cta-banner">
              }
            />
          </Variant>
        </div>
      </Section>

      <Section id="community-banner" title="CommunityBanner">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (no image)">
            <StrapiCommunityBanner component={communityBannerDefaultExample} />
          </Variant>
        </div>
      </Section>

      <Section id="blog-post-header" title="BlogPostHeader">
        <div className="space-y-10">
          <Variant label="Full (with all fields, dark background)">
            <div className="bg-strapi-gray-950 -mx-6 rounded-2xl p-6 lg:p-10">
              <BlogPostHeader
                title="Let's Build A Strapi Plugin To Integrate Vercel's AI SDK In Our Next.js 16 Project"
                publishedAt="2026-02-19T00:00:00.000Z"
                content={"Lorem ipsum ".repeat(1400)}
                author={{
                  id: 1,
                  username: "Paul Bratslavsky",
                  slug: "paul-bratslavsky",
                  avatar: {
                    image: mockBasicImage(PLACEHOLDER_AVATAR, "Author avatar", {
                      width: 200,
                      height: 200,
                    }),
                  },
                }}
                category={{ name: "Engineering", slug: "engineering" }}
                tags={[
                  { id: 1, name: "Strapi v5", slug: "strapi-v5" },
                  { id: 2, name: "Plugins", slug: "plugins" },
                  { id: 3, name: "AI", slug: "ai" },
                ]}
                image={{
                  image: mockBasicImage(PLACEHOLDER_IMG, "Cover image"),
                }}
              />
            </div>
          </Variant>

          <Variant label="Minimal (no tags, no image, no category)">
            <div className="bg-strapi-gray-950 -mx-6 rounded-2xl p-6 lg:p-10">
              <BlogPostHeader
                title="A Short Blog Post Title"
                publishedAt="2026-01-15T00:00:00.000Z"
                content={"Short content. ".repeat(50)}
                author={{
                  id: 2,
                  username: "Jane Doe",
                  slug: "jane-doe",
                  avatar: null,
                }}
              />
            </div>
          </Variant>

          <Variant label="Multiple authors">
            <div className="bg-strapi-gray-950 -mx-6 rounded-2xl p-6 lg:p-10">
              <BlogPostHeader
                title="Collaborative Guide to Building Modern APIs"
                publishedAt="2026-03-01T00:00:00.000Z"
                content={"Content ".repeat(800)}
                author={{
                  id: 1,
                  username: "Paul Bratslavsky",
                  slug: "paul-bratslavsky",
                  avatar: {
                    image: mockBasicImage(PLACEHOLDER_AVATAR, "Author 1", {
                      width: 200,
                      height: 200,
                    }),
                  },
                }}
                coauthors={[
                  {
                    id: 3,
                    username: "Alex Smith",
                    slug: "alex-smith",
                    avatar: {
                      image: mockBasicImage(
                        "https://picsum.photos/seed/alex/200/200",
                        "Author 2",
                        { width: 200, height: 200 }
                      ),
                    },
                  },
                ]}
                category={{ name: "Tutorials", slug: "tutorials" }}
                tags={[
                  { id: 1, name: "API", slug: "api" },
                  { id: 2, name: "REST", slug: "rest" },
                ]}
              />
            </div>
          </Variant>
        </div>
      </Section>
    </div>
  )
}
