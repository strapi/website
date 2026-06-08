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
import { cn } from "@/lib/styles"

export function StrapiFeatureCard({
  component,
}: {
  readonly component: Data.Component<"cards.feature-card">
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
              <StrapiBasicImage
                component={component.image}
                mode="responsive"
                className="w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </FeatureCardImage>
          )}

          <FeatureCardContent size={hasImage ? "lg" : size}>
            <FeatureCardTitle
              size={size}
              icon={
                component.icon ? (
                  <StrapiBasicImage
                    component={component.icon}
                    mode="intrinsic"
                    className={cn(
                      !(component.icon.width && component.icon.height) &&
                        "size-10 object-contain"
                    )}
                  />
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

          {hasImage && !imageOnLeft && (
            <FeatureCardImage>
              <StrapiBasicImage
                component={component.image}
                mode="responsive"
                className="w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </FeatureCardImage>
          )}
        </FeatureCard>
      </Container>
    </section>
  )
}
