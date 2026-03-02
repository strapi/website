import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

/**
 * 6-image repeating cycle:
 *   md (2/row): 7+5, 5+7, 7+5
 *   lg (3/row): 5+3+4, 4+3+5
 */
function getSpanClass(index: number): string {
  switch (index % 6) {
    case 0:
      return "col-span-3 md:col-span-7 lg:col-span-5"
    case 1:
      return "col-span-3 md:col-span-5 lg:col-span-3"
    case 2:
      return "col-span-3 md:col-span-5 lg:col-span-4"
    case 3:
      return "col-span-3 md:col-span-7 lg:col-span-4"
    case 4:
      return "col-span-3 md:col-span-7 lg:col-span-3"
    case 5:
      return "col-span-3 md:col-span-5 lg:col-span-5"

    default:
      return "col-span-3 md:col-span-6 lg:col-span-4"
  }
}

export function StrapiImageGallery({
  component,
}: {
  readonly component: Data.Component<"sections.image-gallery">
}) {
  const images = component.images ?? []

  if (images.length === 0) {
    return null
  }

  const isFullBleed = component.variant === "full-bleed"
  const Wrapper = isFullBleed ? "div" : Container

  return (
    <section className="py-16 lg:py-24">
      <Wrapper className={isFullBleed ? "px-4" : undefined}>
        <div className="grid grid-cols-6 gap-3 md:grid-cols-12 md:gap-4">
          {images.map((image, index) => (
            <div key={image.id} className={getSpanClass(index)}>
              <div className="rounded-strapi-sm relative h-48 overflow-hidden md:h-64 lg:h-72">
                <StrapiBasicImage
                  component={image}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  )
}
