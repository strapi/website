import { CopySimpleIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { HeroContainer } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { Typography } from "@/components/typography"

export function StrapiHeroHome({
  component,
}: {
  readonly component: Data.Component<"sections.hero-home">
}) {
  return (
    <HeroContainer>
      {component.cta ? (
        <div className="hero-home-card-border rounded-strapi-lg p-px">
          <div className="bg-strapi-gray-950 rounded-strapi-lg flex w-full">
            <div className="border-strapi-gray-700/30 flex shrink-0 basis-1/2 flex-col justify-between border-r px-14 py-16">
              <Typography variant="header1" textColor="white">
                {component.title}
              </Typography>

              {component.cta.code ? (
                <div className="mt-8 flex items-center gap-4">
                  <div className="hero-home-code-border rounded-lg p-px">
                    <div className="bg-strapi-gray-950 flex items-center gap-3 rounded-lg px-4 py-3">
                      <code className="text-strapi-neutral-300 font-mono text-sm whitespace-nowrap">
                        {component.cta.code}
                      </code>

                      <button
                        type="button"
                        className="text-strapi-neutral-500 hover:text-strapi-neutral-300 shrink-0 transition-colors"
                      >
                        <CopySimpleIcon size={16} weight="bold" />
                      </button>
                    </div>
                  </div>

                  {component.cta.cta ? (
                    <div className="text-strapi-neutral-400 flex items-center gap-3 text-sm">
                      <span>or</span>
                      <StrapiLink component={component.cta.cta} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {component.testimonials ? (
              <div className="flex min-w-0 flex-1 flex-col">
                {component.testimonials.title ? (
                  <div className="border-strapi-gray-700/30 flex items-center justify-center border-b px-6 py-5">
                    <p className="text-strapi-neutral-500 text-center text-sm">
                      {component.testimonials.title}
                    </p>
                  </div>
                ) : null}

                {component.testimonials.logos?.length ? (
                  <div className="*:border-strapi-gray-700/30 grid flex-1 grid-cols-3 *:border-r *:border-b [&>*:nth-child(3n)]:border-r-0 [&>*:nth-last-child(-n+3)]:border-b-0">
                    {component.testimonials.logos.map((logo) => (
                      <div
                        key={logo.id}
                        className="relative flex items-center justify-center p-5"
                      >
                        <StrapiBasicImage
                          component={logo}
                          fill
                          className="object-contain p-14"
                        />
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
