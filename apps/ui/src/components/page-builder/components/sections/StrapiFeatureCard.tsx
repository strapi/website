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
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

export function StrapiFeatureCard({
  component,
}: {
  readonly component: Data.Component<"sections.feature-card">
}) {
  const hasImage = !!component.image
  const imageOnLeft = component.imagePosition === "left"
  const size = component.size ?? "default"

  return (
    <section>
      <Container className="py-16">
        <FeatureCard
          variant={component.variant ?? "plain"}
          layout={hasImage ? "split" : "stacked"}
          size={size}
        >
          {hasImage && imageOnLeft && (
            <FeatureCardImage>
              <StrapiBasicImage component={component.image} />
            </FeatureCardImage>
          )}

          <FeatureCardContent size={hasImage ? "lg" : size}>
            <FeatureCardTitle
              size={size}
              icon={
                component.icon ? (
                  <StrapiBasicImage component={component.icon} />
                ) : undefined
              }
            >
              {component.title}
            </FeatureCardTitle>

            {component.description && (
              <FeatureCardDescription size={size}>
                {component.description}
              </FeatureCardDescription>
            )}

            {component.ctaLinks && component.ctaLinks.length > 0 && (
              <FeatureCardCTA spacing={size}>
                {component.ctaLinks.map((link) => (
                  <StrapiLink key={link.id} component={link} />
                ))}
              </FeatureCardCTA>
            )}
          </FeatureCardContent>

          {hasImage && !imageOnLeft && (
            <FeatureCardImage>
              <StrapiBasicImage component={component.image} />
            </FeatureCardImage>
          )}
        </FeatureCard>
      </Container>
    </section>
  )
}
