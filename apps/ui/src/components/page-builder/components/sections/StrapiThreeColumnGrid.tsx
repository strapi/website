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

type ItemStyle = "default" | "bordered"

export function StrapiThreeColumnGrid({
  component,
}: {
  readonly component: Data.Component<"sections.three-column-grid">
}) {
  const variant: ColumnGridVariant = component.variant ?? "default"
  const size: ColumnGridSize = component.size ?? "default"
  const itemStyle: ItemStyle = component.itemStyle ?? "default"
  const classes = getColumnGridItemClasses(size, variant)
  const isBordered = itemStyle === "bordered"

  const gridGap = isBordered
    ? "gap-y-10 lg:gap-x-20 lg:gap-y-16"
    : size === "xl"
      ? "gap-y-12 lg:gap-x-20 lg:gap-y-20"
      : "gap-y-10 lg:gap-x-12 lg:gap-y-16"

  return (
    <Box variant={component.background ?? "none"} className="py-16 lg:py-32">
      <Container className="relative">
        {component.section && (
          <StrapiSectionHeader component={component.section} />
        )}

        {component.items && component.items.length > 0 && (
          <div
            className={`mt-12 grid grid-cols-1 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 ${gridGap}`}
          >
            {component.items.map((item) => (
              <div
                key={item.id}
                className={
                  isBordered
                    ? "flex flex-row gap-6 lg:gap-8"
                    : "flex flex-col gap-3"
                }
              >
                {isBordered && (
                  <div className="bg-strapi-neutral-200 w-0.5 shrink-0 self-stretch rounded-full" />
                )}

                <div
                  className={
                    isBordered ? "flex flex-1 flex-col gap-2" : "contents"
                  }
                >
                  <div className="flex items-start gap-3">
                    {item.icon && (
                      <div
                        className={
                          isBordered
                            ? "relative size-6 shrink-0"
                            : "relative size-10 shrink-0"
                        }
                      >
                        <StrapiBasicImage
                          component={item.icon}
                          mode="fill"
                          className="object-contain"
                          sizes={isBordered ? "24px" : "40px"}
                          decorative
                        />
                      </div>
                    )}

                    <h3 className={classes.title}>{item.title}</h3>
                  </div>

                  <p className={classes.description}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Box>
  )
}
