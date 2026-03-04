import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"
import type { Data } from "@repo/strapi-types"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { Container } from "@/components/elementary/Container"
import { TriangleMask } from "@/components/elementary/TriangleMask"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { getStrapiLinkTextHref } from "@/components/page-builder/components/utilities/StrapiLinkText"

export function StrapiCaseStudyCard({
  component,
}: {
  readonly component: Data.Component<"cards.case-study-card">
}) {
  const linkHref = getStrapiLinkTextHref(component.ctaLink)

  if (!linkHref) {
    return null
  }

  return (
    <section className="py-16 lg:pt-12 lg:pb-32">
      <Container>
        <div className="relative mx-auto max-w-4xl">
          {component.backgroundImage && (
            <div className="absolute -bottom-12 -left-24 z-0 size-64 lg:size-96">
              <TriangleMask position="bottom-left">
                <StrapiBasicImage
                  component={component.backgroundImage}
                  fill
                  className="object-cover"
                />
              </TriangleMask>
            </div>
          )}

          <AppLinkUnstyled
            href={linkHref}
            openInNewTab={component.ctaLink?.newTab ?? false}
            className="group relative block no-underline"
          >
            <div className="rounded-strapi-lg animate-spring-sm bg-white shadow-md">
              <div className="flex flex-col p-8 lg:flex-row-reverse lg:items-center lg:justify-between lg:p-19">
                {component.image && (
                  <div className="relative mb-8 h-16 w-36 shrink-0 lg:mb-0 lg:h-28 lg:w-32">
                    <StrapiBasicImage
                      component={component.image}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="max-w-140">
                  <span className="text-xs font-bold tracking-wider text-emerald-500 uppercase lg:text-sm">
                    {component.companyName}
                  </span>

                  <h3 className="text-foreground mt-8 text-lg leading-snug font-semibold lg:text-2xl">
                    {component.title}
                  </h3>
                </div>
              </div>

              <div className="border-border relative flex items-center justify-between border-t px-8 py-6 lg:px-19 lg:py-7">
                <span className="text-xs font-bold tracking-wider text-emerald-500 uppercase lg:text-sm">
                  {component.ctaLink?.label}
                </span>

                <CaretRightIcon
                  className="ml-4 size-3 text-emerald-500"
                  weight="bold"
                  aria-hidden="true"
                />
              </div>
            </div>
          </AppLinkUnstyled>
        </div>
      </Container>
    </section>
  )
}
