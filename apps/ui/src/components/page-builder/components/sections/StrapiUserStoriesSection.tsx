"use client"

import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { FilterableCardGrid } from "@/components/elementary/card-grid"
import { Container } from "@/components/elementary/Container"
import {
  SectionTitle,
  SectionLabel,
} from "@/components/elementary/section-header"
import {
  Card,
  CardContent,
  CardFooter,
  CardImage,
  CardLabel,
} from "@/components/ui/card"

interface MockUserStory extends Record<string, unknown> {
  readonly title: string
  readonly company: string
  readonly category: string
}

const MOCK_STORIES: readonly MockUserStory[] = [
  {
    title: "How Acme Corp rebuilt their marketing site in weeks",
    company: "Acme Corp",
    category: "Websites",
  },
  {
    title: "NextGen Digital transforms their agency workflow with Strapi",
    company: "NextGen Digital",
    category: "Websites",
  },
  {
    title: "TechBridge scales headless APIs for millions of requests",
    company: "TechBridge",
    category: "Backend Framework",
  },
  {
    title: "DataFlow powers their SaaS platform on a flexible backend",
    company: "DataFlow",
    category: "Backend Framework",
  },
  {
    title: "MobileFirst delivers content to 2M+ app users worldwide",
    company: "MobileFirst",
    category: "Mobile Apps",
  },
  {
    title: "Travelio builds a cross-platform travel companion in record time",
    company: "Travelio",
    category: "Mobile Apps",
  },
  {
    title: "OperationsHub streamlines internal tooling across 50 teams",
    company: "OperationsHub",
    category: "Internal Apps",
  },
  {
    title: "SmartDisplay powers digital signage across 500+ venues",
    company: "SmartDisplay",
    category: "IoT & Digital Signage",
  },
]

const USE_CASES_FILTER = [
  {
    label: "Use cases",
    options: [
      { label: "Websites", value: "Websites" },
      { label: "Backend Framework", value: "Backend Framework" },
      { label: "Internal Apps", value: "Internal Apps" },
      { label: "Mobile Apps", value: "Mobile Apps" },
      { label: "IoT & Digital Signage", value: "IoT & Digital Signage" },
    ],
  },
]

export function StrapiUserStoriesSection({
  component,
}: {
  readonly component: Data.Component<"sections.user-stories-section">
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
              <SectionTitle as="h2">{component.heading}</SectionTitle>
            )}
          </div>
        )}

        <FilterableCardGrid<MockUserStory>
          columns={3}
          filters={USE_CASES_FILTER}
          items={MOCK_STORIES}
          renderItem={(item) => (
            <Card key={item.title}>
              <CardImage className="aspect-video w-full">
                <div className="h-full w-full bg-gray-200" />
              </CardImage>

              <CardContent>
                <CardLabel>{item.company}</CardLabel>

                <h3 className="text-foreground text-lg font-bold">
                  {item.title}
                </h3>
              </CardContent>

              <CardFooter>
                <a
                  href="#"
                  className="text-strapi-green-600 hover:text-strapi-green-700 inline-flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  Read a story
                  <ArrowRightIcon className="size-4" />
                </a>
              </CardFooter>
            </Card>
          )}
          searchKey="title"
          searchPlaceholder="Search user stories..."
        />
      </Container>
    </section>
  )
}
