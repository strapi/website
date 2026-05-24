import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"

import {
  getColumnGridItemClasses,
  type ColumnGridSize,
  type ColumnGridVariant,
} from "./strapi-column-grid/item-styles"

export function StrapiTwoColumnGrid({
  component,
}: {
  readonly component: Data.Component<"sections.two-column-grid">
}) {
  const variant: ColumnGridVariant = component.variant ?? "default"
  const size: ColumnGridSize = component.size ?? "default"
  const classes = getColumnGridItemClasses(size, variant)

  const gridGap =
    size === "xl"
      ? "gap-y-12 lg:gap-x-20 lg:gap-y-20"
      : "gap-y-10 lg:gap-x-16 lg:gap-y-16"

  return (
    <Box variant={component.background ?? "none"} className="py-16 lg:py-32">
      <Container className="relative">
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div
            className={`mt-12 grid grid-cols-1 lg:mt-20 lg:grid-cols-2 ${gridGap}`}
          >
            {component.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {item.icon && (
                    <div className="relative size-10 shrink-0">
                      <StrapiBasicImage
                        component={item.icon}
                        mode="fill"
                        className="object-contain"
                        sizes="40px"
                        decorative
                      />
                    </div>
                  )}

                  <h3 className={classes.title}>{item.title}</h3>
                </div>

                <p className={classes.description}>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Box>
  )
}
