import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

import { StrapiSectionHeader as UtilityStrapiSectionHeader } from "../utilities/StrapiSectionHeader"

const backgroundStyles = {
  none: "",
  light: "bg-strapi-blue-100",
  dark: "bg-strapi-blue-800",
} as const

export function StrapiSectionHeader({
  component,
}: {
  readonly component: Data.Component<"sections.section-header">
}) {
  if (!component.section) {
    return null
  }

  const background =
    (component.background as keyof typeof backgroundStyles) ?? "none"
  const isDark = background === "dark"
  const isBoxed = component.boxed === true
  const hasSectionImage = component.sectionImage != null
  const hasBackground = background !== "none"
  const layout = component.section.layout ?? "center"
  const isCenter = layout === "center"

  return (
    <section className={cn(!isBoxed && backgroundStyles[background])}>
      <Container className="relative">
        <div
          className={cn(
            "relative flex flex-col px-8 py-12 lg:px-16 lg:py-24",
            isBoxed &&
              hasBackground && [
                backgroundStyles[background],
                "rounded-strapi-lg overflow-hidden",
              ],
            hasSectionImage && {
              "items-center gap-12": isCenter,
              "items-center gap-12 lg:flex-row lg:items-start lg:gap-16":
                !isCenter,
            }
          )}
        >
          <div
            className={cn(
              { "flex-1": hasSectionImage && !isCenter },
              layout === "right" && "lg:order-2"
            )}
          >
            <UtilityStrapiSectionHeader
              component={component.section}
              variantOverride={isDark ? "inverse" : undefined}
            />
          </div>

          {hasSectionImage && (
            <div
              className={cn(
                "rounded-strapi-lg relative w-full overflow-hidden",
                isCenter ? "aspect-21/9 max-w-5xl" : "aspect-video flex-1",
                layout === "right" && "lg:order-1"
              )}
            >
              <StrapiBasicImage
                component={component.sectionImage}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
