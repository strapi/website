import type { Data } from "@repo/strapi-types"

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
import {
  Quote,
  QuoteAuthor,
  QuoteText,
  QuoteTriangle,
} from "@/components/elementary/quote"
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
import { StrapiNewsletter } from "@/components/page-builder/components/forms/StrapiNewsletter"
import { StrapiTopBanner } from "@/components/page-builder/components/navigation/top-banner/StrapiTopBanner"
import { StrapiAuthorBanner } from "@/components/page-builder/components/sections/StrapiAuthorBanner"
import { StrapiBrandLogoGrid } from "@/components/page-builder/components/sections/StrapiBrandLogoGrid"
import { StrapiContentCard } from "@/components/page-builder/components/sections/StrapiContentCard"
import { StrapiFaqSection } from "@/components/page-builder/components/sections/StrapiFaqSection"
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
import { Button } from "@/components/ui/button"

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
  { id: "quote", label: "Quote" },
  { id: "newsletter-banner", label: "NewsletterBanner" },
  { id: "command-cta", label: "CommandCTA" },
  { id: "two-columns-benefits", label: "TwoColumnsBenefits" },
  { id: "two-column-grid", label: "TwoColumnGrid" },
  { id: "top-banner", label: "TopBanner" },
  { id: "content-card", label: "ContentCard" },
  { id: "box", label: "Box" },
  { id: "faq-section", label: "FaqSection" },
  { id: "how-it-works", label: "HowItWorks" },
  { id: "author-banner", label: "AuthorBanner" },
  { id: "integrations-section", label: "IntegrationsSection" },
  { id: "user-stories-section", label: "UserStoriesSection" },
  { id: "brand-logo-grid", label: "BrandLogoGrid" },
] as const

const newsletterBannerDefaultExample = {
  title: "Join our Newsletter",
  description: "Get all the latest Strapi updates, news and events.",
  emailPlaceholder: "Enter your email address",
  submitLabel: "Subscribe",
  consentText:
    "By submitting this form you consent to us emailing you occasionally about our products and services. You can unsubscribe from emails at any time, and we will never pass your email to third parties.",
} as Data.Component<"forms.newsletter">

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

const twoColumnGridGradientExample = {
  ...twoColumnGridDefaultExample,
  background: "gradient",
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
} as Data.Component<"sections.content-card">

const contentCardNoLabelExample = {
  title: "What is Strapi?",
  content:
    "Strapi is an open-source, headless CMS built on Node.js that gives developers complete control over their content architecture and deployment environment. It supports both **REST and GraphQL APIs** out of the box.\n\n- Fully customizable content types\n- Role-based access control\n- Plugin ecosystem for extensibility\n- Self-hosted or managed cloud deployment",
} as Data.Component<"sections.content-card">

const faqSectionDefaultExample = {
  sectionLabel: "FAQ",
  heading: "Frequently Asked Questions",
  description:
    "Find answers to common questions about Strapi, our pricing, and how to get started.",
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

const authorBannerDefaultExample = {
  authorName: "Pierre Burgy",
  authorRole: "CEO & Co-founder",
  authorBio:
    "Pierre is the CEO and co-founder of Strapi, the leading open-source headless CMS. He is passionate about open source, developer experience, and building products that empower creators.",
  authorUrl: "https://strapi.io",
} as Data.Component<"blog.author-banner">

const authorBannerMinimalExample = {
  authorName: "Jane Doe",
  authorRole: "Guest Author",
} as Data.Component<"blog.author-banner">

const integrationsSectionDefaultExample = {
  label: "Integrations",
  heading: "Works with your favorite tools",
} as Data.Component<"sections.integrations-section">

const userStoriesSectionDefaultExample = {
  label: "User Stories",
  heading: "See what others are building with Strapi",
} as Data.Component<"sections.user-stories-section">

const brandLogoGridPlainExample = {
  title: "Trusted by",
  variant: "plain",
  items: [
    { id: 1, image: null },
    { id: 2, image: null },
    { id: 3, image: null },
    { id: 4, image: null },
    { id: 5, image: null },
  ],
} as Data.Component<"sections.brand-logo-grid">

const brandLogoGridBorderedExample = {
  title: "Our Partners",
  variant: "bordered",
  items: [
    { id: 1, image: null },
    { id: 2, image: null },
    { id: 3, image: null },
    { id: 4, image: null },
  ],
} as Data.Component<"sections.brand-logo-grid">

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
            <div className="flex items-center gap-6">
              <div className="rounded bg-gray-800 p-4">
                <Spinner className="h-4 w-4 border-2" />
              </div>
              <div className="rounded bg-gray-800 p-4">
                <Spinner className="h-6 w-6 border-2" />
              </div>
              <Spinner
                className="h-6 w-6 border-2"
                borderColorClass="border-strapi-blue-600"
              />
              <Spinner
                className="h-8 w-8 border-3"
                borderColorClass="border-strapi-purple-500"
              />
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

          <Variant label="background: darker">
            <SectionHeaderContainer background="darker">
              <SectionHeader>
                <SectionLabel variant="inverse">Label</SectionLabel>
                <SectionTitle size="sm" variant="inverse">
                  Dark background (900)
                </SectionTitle>
                <SectionDescription variant="inverse">
                  Container using the `darker` variant.
                </SectionDescription>
              </SectionHeader>
            </SectionHeaderContainer>
          </Variant>

          <Variant label="background: darker + boxed">
            <SectionHeaderContainer background="darker" boxed>
              <SectionHeader>
                <SectionLabel variant="inverse">Label</SectionLabel>
                <SectionTitle size="sm" variant="inverse">
                  Boxed dark background (900)
                </SectionTitle>
                <SectionDescription variant="inverse">
                  Rounded boxed variant with the darker blue background.
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

          <Variant label="FeatureCardTitle (uses Typography header3)">
            <div className="space-y-4">
              <FeatureCardTitle>Default title</FeatureCardTitle>
              <FeatureCardTitle as="h2">As h2</FeatureCardTitle>
              <FeatureCardTitle as="h4">As h4</FeatureCardTitle>
            </div>
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
              <QuoteTriangle />
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

          <Variant label="Gradient background">
            <StrapiTwoColumnGrid component={twoColumnGridGradientExample} />
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
              {(
                [
                  "none",
                  "light",
                  "dark",
                  "darker",
                  "green",
                  "gradient",
                ] as const
              ).map((variant) => (
                <Box key={variant} variant={variant} className="rounded-lg p-8">
                  <p
                    className={`relative z-10 text-center text-sm font-medium ${
                      variant === "dark" ||
                      variant === "darker" ||
                      variant === "green"
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
      {/* AuthorBanner                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Section id="author-banner" title="AuthorBanner">
        <div className="-mx-6 space-y-10">
          <Variant label="Default (name, role, bio, link — no avatar)">
            <StrapiAuthorBanner component={authorBannerDefaultExample} />
          </Variant>

          <Variant label="Minimal (name and role only)">
            <StrapiAuthorBanner component={authorBannerMinimalExample} />
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
    </div>
  )
}
