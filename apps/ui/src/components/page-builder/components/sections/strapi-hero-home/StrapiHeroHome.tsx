import type { Data } from "@repo/strapi-types"

import { HeroContainer } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

import { StrapiHeroHomeCodeCta } from "./StrapiHeroHomeCodeCta"

export function StrapiHeroHome({
  component,
}: {
  readonly component: Data.Component<"sections.hero-home">
}) {
  return (
    <HeroContainer>
      {component.cta ? (
        <div className="border-strapi-gray-700/50 rounded-strapi-lg md:border">
          <div className="md:bg-strapi-gray-950 rounded-strapi-lg flex w-full flex-col px-4 md:flex-row md:px-0">
            <div className="border-strapi-gray-700/50 flex shrink-0 grow basis-1/2 flex-col items-center justify-between px-0 py-16 text-center md:items-start md:border-r md:px-14 md:text-left">
              <Typography variant="header1" textColor="white">
                {component.title}
              </Typography>

              {component.cta.code ? (
                <div className="mt-11 flex w-full flex-row flex-wrap items-center justify-center gap-6 md:justify-start">
                  <StrapiHeroHomeCodeCta code={component.cta.code} />

                  {component.cta.cta ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-strapi-neutral-400 font-light">
                        or
                      </span>
                      <StrapiLink
                        className="p-0 text-base font-normal text-white"
                        component={component.cta.cta}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {component.testimonials ? (
              <div className="border-strapi-gray-700/50 rounded-strapi-lg grid grow-0 grid-cols-1 max-md:border">
                {component.testimonials.title ? (
                  <div className="border-strapi-gray-700/50 flex items-center justify-center border-b px-8 py-5 sm:px-12">
                    <Typography
                      variant="body2"
                      className="text-strapi-gray-400 px-6 text-center"
                    >
                      {component.testimonials.title}
                    </Typography>
                  </div>
                ) : null}

                {component.testimonials.logos?.length ? (
                  <div
                    className={cn(
                      "*:border-strapi-gray-700/50 grid flex-1 grid-cols-3 *:border-r *:border-b md:grid-cols-2 lg:grid-cols-3",
                      "max-md:[&>*:nth-child(3n)]:border-r-0 max-md:[&>*:nth-last-child(-n+3)]:border-b-0",
                      "md:max-md:[&>*:nth-child(2n)]:border-r-0",
                      "lg:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-last-child(-n+3)]:border-b-0"
                    )}
                  >
                    {component.testimonials.logos.map((logo) => (
                      <div
                        key={logo.id}
                        className="flex items-center justify-center p-5"
                      >
                        <div className="relative aspect-3/2 w-full max-w-[180px]">
                          <StrapiBasicImage
                            component={logo}
                            transparentPlaceholder
                            fill
                            sizes="(max-width: 1024px) 30vw, 180px"
                            className="object-contain p-6"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </HeroContainer>
  )
}
