import type { Data } from "@repo/strapi-types"
import { Tabs as TabsPrimitive } from "radix-ui"

import { Container } from "@/components/elementary/Container"
import {
  FeatureCard,
  FeatureCardContent,
  FeatureCardCTA,
  FeatureCardDescription,
  FeatureCardImage,
  FeatureCardTitle,
} from "@/components/elementary/feature-card"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { cn } from "@/lib/styles"

/**
 * Section header + horizontal pill tab strip switching between bordered FeatureOverview cards.
 *
 * The pill switcher is a custom skin built on radix Tabs primitives (which auto-mark
 * themselves as client components). Tabs.Root runs uncontrolled with `defaultValue` so
 * this wrapper stays a server component — required because each tab's content includes
 * FeatureCardDescription, which transitively pulls in the `server-only` Markdown module.
 */
export function StrapiTabbedFeatureOverview({
  component,
}: {
  readonly component: Data.Component<"sections.tabbed-feature-overview">
}) {
  const tabs = (component.tabs ?? []).filter(
    (
      tab
    ): tab is NonNullable<typeof tab> & {
      content: NonNullable<typeof tab.content>
    } => Boolean(tab?.content)
  )

  if (tabs.length === 0 || !component.section) {
    return null
  }

  // Use the array index as the tab `value`, not `tab.id`. Strapi component IDs
  // are deterministic per row but they can theoretically collide with the
  // index-zero fallback if a tab.id ever lands at 0, and indexes are stable
  // for an SSR-rendered list. Keeps the default tab matching the first item.
  const defaultValue = "0"

  return (
    <section>
      <Container className="flex flex-col items-center gap-12 py-16 lg:gap-20 lg:py-24">
        <StrapiSectionHeader component={component.section} />

        <TabsPrimitive.Root
          defaultValue={defaultValue}
          className="flex w-full flex-col items-center gap-12 lg:gap-20"
        >
          <TabsPrimitive.List
            className={cn(
              "flex w-full max-w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto",
              "px-1 lg:justify-center lg:overflow-visible lg:px-0",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
          >
            {tabs.map((tab, index) => (
              <TabsPrimitive.Trigger
                key={tab.id ?? index}
                value={String(index)}
                className={cn(
                  "group inline-flex shrink-0 items-start gap-2 rounded-full px-4 py-2 whitespace-nowrap",
                  "text-base font-semibold transition-colors",
                  "bg-strapi-neutral-100 text-strapi-neutral-700",
                  "hover:bg-strapi-blue-200 hover:text-strapi-blue-800",
                  "data-[state=active]:bg-strapi-blue-600 data-[state=active]:text-white",
                  "data-[state=active]:hover:bg-strapi-blue-600",
                  "focus-visible:ring-strapi-blue-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                )}
              >
                {tab.tabIcon && (
                  <StrapiBasicImage
                    component={tab.tabIcon}
                    mode="intrinsic"
                    className="size-6 shrink-0 transition group-data-[state=active]:brightness-0 group-data-[state=active]:invert"
                    decorative
                  />
                )}
                {tab.tabLabel}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>

          <div className="w-full">
            {tabs.map((tab, index) => (
              <TabsPrimitive.Content
                key={tab.id ?? index}
                value={String(index)}
                className="outline-none"
              >
                <TabCard content={tab.content} />
              </TabsPrimitive.Content>
            ))}
          </div>
        </TabsPrimitive.Root>
      </Container>
    </section>
  )
}

function TabCard({
  content,
}: {
  readonly content: NonNullable<
    Data.Component<"elements.tabbed-feature">["content"]
  >
}) {
  return (
    <FeatureCard
      variant="bordered"
      layout="split"
      size="lg"
      className="rounded-strapi-lg border"
    >
      <FeatureCardContent size="lg" className="gap-6 lg:gap-6">
        {content.label && (
          <div className="flex items-start gap-3">
            {content.labelIcon && (
              <StrapiBasicImage
                component={content.labelIcon}
                mode="intrinsic"
                className="mt-1 size-4 shrink-0"
                decorative
              />
            )}
            <span className="text-strapi-blue-600 text-base font-semibold tracking-wider">
              {content.label}
            </span>
          </div>
        )}

        <FeatureCardTitle as="h2" size="lg" className="text-foreground">
          {content.title}
        </FeatureCardTitle>

        {content.description && (
          <FeatureCardDescription
            size="lg"
            className="text-foreground/90 leading-relaxed"
          >
            {content.description}
          </FeatureCardDescription>
        )}

        {content.ctaLinks && content.ctaLinks.length > 0 && (
          <FeatureCardCTA spacing="lg" className="mt-4">
            {content.ctaLinks.map((link) => (
              <StrapiLink
                key={link.id}
                component={{
                  ...link,
                  decorations: {
                    id: link.id ?? "",
                    variant: "secondary",
                    ...link?.decorations,
                  },
                }}
              />
            ))}
          </FeatureCardCTA>
        )}
      </FeatureCardContent>

      {content.image && (
        <FeatureCardImage>
          <StrapiBasicImage
            component={content.image}
            mode="responsive"
            className="size-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </FeatureCardImage>
      )}
    </FeatureCard>
  )
}
