import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  FeatureCard,
  FeatureCardContent,
  FeatureCardCTA,
  FeatureCardDescription,
  FeatureCardTitle,
} from "@/components/elementary/feature-card"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"

export function StrapiFeatureCardGrid({
  component,
}: {
  readonly component: Data.Component<"sections.feature-card-grid">
}) {
  const columns = component.columns ?? "3"
  const iconPosition = columns === "3" ? "top" : "inline"

  const gridClassName =
    columns === "2"
      ? "grid grid-cols-1 gap-8 lg:grid-cols-2"
      : "grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"

  return (
    <Box variant={component.background ?? "none"} className="py-16 lg:py-32">
      <Container>
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div className={`mt-12 lg:mt-20 ${gridClassName}`}>
            {component.items.map((item) => (
              <FeatureCard
                key={item.id}
                variant={item.variant ?? "bordered"}
                layout="stacked"
                size="sm"
              >
                <FeatureCardContent size="sm">
                  <FeatureCardTitle
                    as="h3"
                    size="sm"
                    iconPosition={iconPosition}
                    icon={
                      item.icon ? (
                        <StrapiBasicImage
                          component={item.icon}
                          mode="intrinsic"
                        />
                      ) : undefined
                    }
                  >
                    {item.title}
                  </FeatureCardTitle>

                  {item.description && (
                    <FeatureCardDescription size="sm">
                      {item.description}
                    </FeatureCardDescription>
                  )}

                  {item.ctaLinks && item.ctaLinks.length > 0 && (
                    <FeatureCardCTA spacing="sm">
                      {item.ctaLinks.map((link) => (
                        <StrapiLink key={link.id} component={link} />
                      ))}
                    </FeatureCardCTA>
                  )}
                </FeatureCardContent>
              </FeatureCard>
            ))}
          </div>
        )}
      </Container>
    </Box>
  )
}
