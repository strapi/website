"use client"

import type { Data } from "@repo/strapi-types"

import {
  CardGridItem,
  FilterableCardGrid,
} from "@/components/elementary/card-grid"
import { Container } from "@/components/elementary/Container"
import { SectionHeading } from "@/components/elementary/SectionHeading"
import { SectionLabel } from "@/components/elementary/SectionLabel"

interface MockIntegration extends Record<string, unknown> {
  readonly name: string
  readonly category: string
  readonly description: string
}

const MOCK_INTEGRATIONS: readonly MockIntegration[] = [
  {
    name: "Next.js",
    category: "Frameworks & Libraries",
    description:
      "Build full-stack web applications with the React framework for the web.",
  },
  {
    name: "Gatsby",
    category: "Frameworks & Libraries",
    description:
      "Create blazing fast static sites and apps powered by React and GraphQL.",
  },
  {
    name: "Mailchimp",
    category: "Marketing Automation",
    description:
      "Automate your marketing campaigns and manage your audience with ease.",
  },
  {
    name: "HubSpot",
    category: "Marketing Automation",
    description:
      "All-in-one CRM platform for marketing, sales, and customer service.",
  },
  {
    name: "Algolia",
    category: "Search",
    description:
      "Add fast, relevant search and discovery experiences to your product.",
  },
  {
    name: "Cloudinary",
    category: "Digital Asset Management",
    description:
      "Manage, transform, optimize, and deliver images and videos at scale.",
  },
  {
    name: "SendGrid",
    category: "Email",
    description:
      "Deliver transactional and marketing email at scale with high deliverability.",
  },
  {
    name: "Vercel",
    category: "Hosting Providers",
    description:
      "Deploy and scale your frontend applications with zero configuration.",
  },
  {
    name: "OpenAI",
    category: "AI",
    description:
      "Integrate powerful language models and AI capabilities into your content.",
  },
  {
    name: "Google Analytics",
    category: "Analytics",
    description:
      "Measure user engagement and track key metrics across your digital properties.",
  },
]

const INTEGRATIONS_FILTER = [
  {
    label: "Categories",
    options: [
      { label: "Frameworks & Libraries", value: "Frameworks & Libraries" },
      { label: "Marketing Automation", value: "Marketing Automation" },
      { label: "Search", value: "Search" },
      { label: "Digital Asset Management", value: "Digital Asset Management" },
      { label: "Email", value: "Email" },
      { label: "Hosting Providers", value: "Hosting Providers" },
      { label: "AI", value: "AI" },
      { label: "Analytics", value: "Analytics" },
    ],
  },
]

export function StrapiIntegrationsSection({
  component,
}: {
  readonly component: Data.Component<"sections.integrations-section">
}) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        {(component.label != null || component.heading != null) && (
          <div className="mb-10 text-center">
            {component.label != null && (
              <SectionLabel className="mb-4">{component.label}</SectionLabel>
            )}

            {component.heading != null && (
              <SectionHeading as="h2">{component.heading}</SectionHeading>
            )}
          </div>
        )}

        <FilterableCardGrid<MockIntegration>
          columns={3}
          filters={INTEGRATIONS_FILTER}
          items={MOCK_INTEGRATIONS}
          renderItem={(item) => (
            <CardGridItem
              key={item.name}
              logo={
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md text-xs font-bold">
                  {item.name.slice(0, 2)}
                </div>
              }
              title={item.name}
              description={item.description}
              variant="integration"
            />
          )}
          searchKey="name"
          searchPlaceholder="Search integrations..."
        />
      </Container>
    </section>
  )
}
