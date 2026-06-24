import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import {
  FeatureCard,
  FeatureCardContent,
  FeatureCardCTA,
  FeatureCardDescription,
  FeatureCardImage,
  FeatureCardTitle,
} from "@/components/elementary/feature-card"
import { Markdown } from "@/components/elementary/markdown/Markdown"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

/**
 * Inner card + optional items grid, without the section/Container wrapper.
 * Reused by StrapiTabbedFeatureOverview so each tab can embed the card content
 * without producing a nested <section><Container> pair.
 */
export function FeatureOverviewContent({
  component,
}: {
  readonly component: Data.Component<"sections.feature-overview">
}) {
  const items = component.items ?? []

  return (
    <>
      <FeatureCard
        variant="bordered"
        layout="split"
        size="lg"
        className="rounded-b-none border-b-0"
      >
        <FeatureCardContent size="lg" className="gap-6 lg:gap-6">
          {component.label && (
            <div className="flex items-start gap-3">
              {component.labelIcon && (
                <StrapiBasicImage
                  component={component.labelIcon}
                  mode="intrinsic"
                  className="mt-1 size-4 shrink-0"
                  decorative
                />
              )}
              <span className="text-strapi-blue-600 text-base font-semibold tracking-wider">
                {component.label}
              </span>
            </div>
          )}

          <FeatureCardTitle as="h2" size="lg" className="text-foreground">
            {component.title}
          </FeatureCardTitle>

          {component.description && (
            <FeatureCardDescription
              size="lg"
              className="text-foreground/90 leading-relaxed"
            >
              {component.description}
            </FeatureCardDescription>
          )}

          {component.ctaLinks && component.ctaLinks.length > 0 && (
            <FeatureCardCTA spacing="lg" className="mt-4">
              {component.ctaLinks.map((link) => (
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

        <FeatureCardImage>
          <StrapiBasicImage
            component={component.image}
            mode="responsive"
            className="size-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </FeatureCardImage>
      </FeatureCard>

      {items.length > 0 && (
        <div className="rounded-b-strapi-lg border-strapi-blue-200 grid grid-cols-1 gap-8 border border-t-0 bg-white p-8 md:grid-cols-3 lg:gap-14 lg:p-20">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {item.icon && (
                  <StrapiBasicImage
                    component={item.icon}
                    mode="intrinsic"
                    className="size-4 shrink-0"
                    decorative
                  />
                )}
                <h3 className="text-foreground text-base font-semibold lg:text-lg">
                  {item.title}
                </h3>
              </div>

              {item.description && (
                <div className="text-strapi-neutral-700 text-sm leading-relaxed lg:text-base">
                  <Markdown>{item.description}</Markdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export function StrapiFeatureOverview({
  component,
}: {
  readonly component: Data.Component<"sections.feature-overview">
}) {
  return (
    <section>
      <Container className="py-8 lg:py-16">
        <FeatureOverviewContent component={component} />
      </Container>
    </section>
  )
}
