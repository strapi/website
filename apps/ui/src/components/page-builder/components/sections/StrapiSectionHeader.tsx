import type { Data } from "@repo/strapi-types"

import {
  SectionHeaderContainer,
  type SectionHeaderContainerBackground,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

import { StrapiSectionHeader as UtilityStrapiSectionHeader } from "../utilities/StrapiSectionHeader"

export function StrapiSectionHeader({
  component,
}: {
  readonly component: Data.Component<"sections.section-header">
}) {
  if (!component.section) {
    return null
  }

  const background =
    (component.background as SectionHeaderContainerBackground | null) ?? "none"
  const isDark = background === "dark" || background === "dark-inverse"
  const isBoxed = component.boxed === true
  const hasSectionImage = component.sectionImage != null
  const layout = component.section.layout ?? "center"
  const isCenter = layout === "center"

  return (
    <SectionHeaderContainer
      background={background}
      boxed={isBoxed}
      contentClassName={cn(
        hasSectionImage && {
          "items-center gap-12": isCenter,
          "items-center gap-12 lg:flex-row lg:items-center lg:gap-16":
            !isCenter,
        }
      )}
    >
      <div
        className={cn(
          { "flex-1": hasSectionImage && !isCenter },
          hasSectionImage && layout === "right" && "lg:order-2"
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
            mode="fill"
            className="object-cover"
            sizes={
              isCenter
                ? "(max-width: 1280px) 100vw, 1024px"
                : "(max-width: 1024px) 100vw, 50vw"
            }
            decorative
          />
        </div>
      )}
    </SectionHeaderContainer>
  )
}
