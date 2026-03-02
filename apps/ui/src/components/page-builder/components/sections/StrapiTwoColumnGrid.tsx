import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { Typography } from "@/components/typography"

export function StrapiTwoColumnGrid({
  component,
}: {
  readonly component: Data.Component<"sections.two-column-grid">
}) {
  const variant = component.variant ?? "default"
  const size = component.size ?? "default"

  return (
    <Box variant={component.background ?? "none"} className="py-16 lg:py-32">
      <Container className="relative">
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-y-10 lg:mt-20 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-16">
            {component.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {item.icon && (
                    <div className="size-10 shrink-0">
                      <StrapiBasicImage
                        component={item.icon}
                        width={40}
                        height={40}
                        className="size-full object-contain"
                      />
                    </div>
                  )}

                  <Typography
                    tag="h3"
                    variant={size === "lg" ? "header3" : "subtitle1"}
                    fontWeight="semiBold"
                    className={
                      variant === "purple"
                        ? "text-strapi-purple-600"
                        : undefined
                    }
                  >
                    {item.title}
                  </Typography>
                </div>

                <Typography tag="p" variant="body1" textColor="neutral">
                  {item.description}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Box>
  )
}
