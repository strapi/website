import type { Data } from "@repo/strapi-types"

import { Box, type BoxVariant } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

import { StrapiSectionHeader } from "../utilities/StrapiSectionHeader"

export function StrapiCtaBanner({
  component,
}: {
  readonly component: Data.Component<"sections.cta-banner">
}) {
  if (!component.section) {
    return null
  }

  const background = (component.background as BoxVariant) ?? "dark-inverse"
  const hasImage = component.sectionImage != null

  return (
    <section>
      <Container>
        <Box variant={background} className="rounded-strapi-lg">
          <div className="relative z-10 flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="flex-1 px-8 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
              <StrapiSectionHeader
                component={component.section}
                variantOverride="inverse"
              />
            </div>

            {hasImage && (
              <div className="relative hidden self-stretch lg:block lg:w-2/5">
                <StrapiBasicImage
                  component={component.sectionImage}
                  mode="fill"
                  className="object-contain object-bottom-right"
                  sizes="(max-width: 1024px) 0px, 40vw"
                  decorative
                />
              </div>
            )}
          </div>
        </Box>
      </Container>
    </section>
  )
}
