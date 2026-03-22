import type { Data } from "@repo/strapi-types"
import type { ReactNode } from "react"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { cn } from "@/lib/styles"

import { ConversionInfoBlock } from "./ConversionInfoBlock"

interface ConversionLayoutProps {
  readonly section?: Data.Component<"utilities.section-header"> | null
  readonly features?: Data.Component<"elements.conversion-feature">[] | null
  readonly infoBlocks?:
    | Data.Component<"elements.conversion-info-block">[]
    | null
  readonly formSlot: ReactNode
}

export function ConversionLayout({
  section,
  features,
  infoBlocks,
  formSlot,
}: ConversionLayoutProps) {
  const hasFeatures = features && features.length > 0
  const hasInfoBlocks = infoBlocks && infoBlocks.length > 0

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col">
            {section && <StrapiSectionHeader component={section} />}

            {hasFeatures && (
              <div
                className={cn("mt-8 grid gap-4", {
                  "grid-cols-1": features!.length === 1,
                  "grid-cols-1 sm:grid-cols-2": features!.length === 2,
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3":
                    features!.length >= 3,
                })}
              >
                {features!.map((feature) => (
                  <div
                    key={feature.id}
                    className="border-strapi-neutral-200 flex flex-col items-center gap-3 rounded-lg border p-4 text-center"
                  >
                    {feature.icon && (
                      <StrapiBasicImage
                        component={feature.icon}
                        mode="responsive"
                        className="h-8 w-auto object-contain"
                        sizes="32px"
                        decorative
                      />
                    )}

                    <p className="text-foreground text-sm font-semibold">
                      {feature.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {hasInfoBlocks && (
              <div className="border-strapi-neutral-200 mt-8 flex flex-col gap-6 rounded-xl border p-6">
                {infoBlocks!.map((block, i) => (
                  <div key={block.id}>
                    {i > 0 && (
                      <div className="bg-strapi-neutral-200 mb-6 h-px" />
                    )}
                    <ConversionInfoBlock block={block} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg lg:p-10">
            {formSlot}
          </div>
        </div>
      </Container>
    </section>
  )
}
