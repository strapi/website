import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import {
  FeatureCard,
  FeatureCardContent,
  FeatureCardCTA,
  FeatureCardDescription,
  FeatureCardImage,
} from "@/components/elementary/feature-card"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { cn } from "@/lib/styles"

export function StrapiFeatureCardGrid({
  component,
}: {
  readonly component: Data.Component<"sections.feature-card-grid">
}) {
  return (
    <Box variant={component.background ?? "none"} className="pt-8 lg:pt-16">
      <Container>
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-6 gap-6",
              component.section ? "mt-12 lg:mt-20" : ""
            )}
          >
            {component.items.map((item) => {
              const layout = item.layout ?? "full"
              const hasImage = !!item.image
              const size = item.size ?? "default"
              const cardLayout =
                layout === "full" && hasImage ? "split" : "stacked"

              // Inlined from FeatureCardTitle so this grid owns its own title
              // visual. All original options are preserved below — edit freely.
              const titleClassName = cn(
                "text-foreground font-bold",
                size === "sm"
                  ? "text-xl"
                  : size === "lg"
                    ? "text-3xl tracking-tight"
                    : "text-2xl"
              )

              return (
                <div
                  key={item.id}
                  className={cn({
                    "col-span-6": layout === "full",
                    "col-span-6 md:col-span-3": layout === "half",
                    "col-span-6 md:col-span-3 lg:col-span-2":
                      layout === "third",
                  })}
                >
                  <FeatureCard
                    variant={item.variant ?? "bordered"}
                    layout={cardLayout}
                    size={size}
                    className="h-full items-start"
                  >
                    {hasImage &&
                      cardLayout === "split" &&
                      item.imagePosition === "left" && (
                        <FeatureCardImage>
                          <StrapiBasicImage
                            component={item.image}
                            mode="responsive"
                            className="w-full"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </FeatureCardImage>
                      )}

                    <FeatureCardContent size={size}>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start">
                          {item.icon ? (
                            <div className="flex h-7.5 shrink-0 items-start">
                              <StrapiBasicImage
                                component={item.icon}
                                mode="intrinsic"
                                className={cn(
                                  !(item.icon.width && item.icon.height) &&
                                    "size-10 object-contain"
                                )}
                              />
                            </div>
                          ) : null}

                          <div className={cn(item.icon && "md:-mt-1")}>
                            <h3 className={titleClassName}>{item.title}</h3>
                            {item.description && !item.icon && (
                              <FeatureCardDescription size={size}>
                                {item.description}
                              </FeatureCardDescription>
                            )}
                          </div>
                        </div>

                        {item.description && item.icon && (
                          <FeatureCardDescription size={size} className="mt-2">
                            {item.description}
                          </FeatureCardDescription>
                        )}
                      </div>

                      {hasImage && cardLayout === "stacked" && (
                        <div className="mt-4">
                          <StrapiBasicImage
                            component={item.image}
                            mode="responsive"
                            className="w-full rounded-lg"
                            sizes={
                              layout === "full"
                                ? "100vw"
                                : layout === "half"
                                  ? "(max-width: 768px) 100vw, 50vw"
                                  : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            }
                          />
                        </div>
                      )}

                      {item.ctaLinks && item.ctaLinks.length > 0 && (
                        <FeatureCardCTA spacing={size}>
                          {item.ctaLinks.map((link) => (
                            <StrapiLink
                              key={link.id}
                              component={{
                                ...link,
                                decorations: {
                                  variant: "secondary",
                                  ...link?.decorations,
                                } as Data.Component<"utilities.link">["decorations"],
                              }}
                            />
                          ))}
                        </FeatureCardCTA>
                      )}
                    </FeatureCardContent>

                    {hasImage &&
                      cardLayout === "split" &&
                      item.imagePosition !== "left" && (
                        <FeatureCardImage>
                          <StrapiBasicImage
                            component={item.image}
                            mode="responsive"
                            className="w-full"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        </FeatureCardImage>
                      )}
                  </FeatureCard>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </Box>
  )
}
