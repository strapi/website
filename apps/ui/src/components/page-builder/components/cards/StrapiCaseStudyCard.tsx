import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"
import type { Data } from "@repo/strapi-types"
import { getTranslations } from "next-intl/server"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { Container } from "@/components/elementary/Container"
import { TriangleMask } from "@/components/elementary/TriangleMask"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export async function StrapiCaseStudyCard({
  component,
}: {
  readonly component: Data.Component<"cards.case-study-card">
}) {
  const caseStudy = component.caseStudy

  if (!caseStudy?.slug) {
    return null
  }

  const t = await getTranslations("caseStudies")

  const foregroundImage =
    caseStudy.logoImage?.image ?? caseStudy.coverImage?.image
  const backgroundImage = caseStudy.coverImage?.image

  return (
    <section className="py-16 lg:pt-12 lg:pb-32">
      <Container>
        <div className="relative mx-auto max-w-4xl">
          {backgroundImage && (
            <div className="absolute -bottom-12 -left-24 z-0 size-64 lg:size-96">
              <TriangleMask position="bottom-left">
                <StrapiBasicImage
                  component={backgroundImage}
                  mode="fill"
                  className="object-cover"
                  sizes="(max-width: 1024px) 256px, 384px"
                  decorative
                />
              </TriangleMask>
            </div>
          )}

          <AppLinkUnstyled
            href={`/user-stories/${caseStudy.slug}`}
            className="group relative block no-underline"
          >
            <div className="rounded-strapi-lg animate-spring-sm bg-white shadow-md">
              <div className="flex flex-col p-8 lg:flex-row-reverse lg:items-center lg:justify-between lg:p-19">
                {foregroundImage && (
                  <div className="relative mb-8 h-16 w-36 shrink-0 lg:mb-0 lg:h-28 lg:w-32">
                    <StrapiBasicImage
                      component={foregroundImage}
                      mode="fill"
                      className="object-contain"
                      sizes="(max-width: 1024px) 144px, 128px"
                    />
                  </div>
                )}

                <div className="max-w-140">
                  {caseStudy.companyName && (
                    <span className="text-strapi-blue-500 text-xs font-bold tracking-wider uppercase lg:text-sm">
                      {caseStudy.companyName}
                    </span>
                  )}

                  <h3 className="text-foreground mt-8 text-lg leading-snug font-semibold lg:text-2xl">
                    {caseStudy.title}
                  </h3>
                </div>
              </div>

              <div className="border-border relative flex items-center justify-between border-t px-8 py-6 lg:px-19 lg:py-7">
                <span className="text-strapi-blue-500 text-xs font-bold tracking-wider uppercase lg:text-sm">
                  {t("readStory")}
                </span>

                <CaretRightIcon
                  className="text-strapi-blue-500 ml-4 size-3"
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
