import type { Data } from "@repo/strapi-types"

import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import type { DynamicZoneRenderContext } from "@/components/page-builder/DynamicZoneRenderer"
import { TypingAnimation } from "@/components/ui/typing-animation"

import { StrapiHeroHomeCodeCta } from "./StrapiHeroHomeCodeCta"
import { StrapiHeroHomeFeatures } from "./StrapiHeroHomeFeatures"
import { TestimonialLogosGrid } from "./TestimonialLogosGrid"

const DEFAULT_ROTATING_PHRASES = [
  "Websites",
  "Web Apps",
  "Mobile Apps",
  "Intranets",
  "LMS",
]

interface StrapiHeroHomeProps {
  readonly component: Data.Component<"sections.hero-home">
  readonly renderContext?: DynamicZoneRenderContext
}

export function StrapiHeroHome({
  component,
  renderContext,
}: StrapiHeroHomeProps) {
  const hasTopRow = Boolean(component.cta)
  const hasFeatures = Boolean(component.features?.length)
  const affectsNavbarTheme =
    renderContext?.surface === "page" && renderContext.isFirst
  const rotatingPhrases =
    (component.rotatingPhrases
      ?.map((phrase) => phrase.text?.trim())
      .filter(Boolean) as string[] | undefined) ?? DEFAULT_ROTATING_PHRASES

  if (!hasTopRow && !hasFeatures) {
    return null
  }

  return (
    <HeroContainer affectsNavbarTheme={affectsNavbarTheme}>
      <HeroContainerContent className="flex flex-col gap-4">
        <div className="animate-ring-reveal ring-strapi-gray-700/50 rounded-strapi-xl overflow-hidden md:ring">
          {hasTopRow ? (
            <div className="md:bg-strapi-gray-950 rounded-strapi-xl flex w-full flex-col md:flex-row">
              <div className="animate-reveal-cascade animate-border-reveal border-strapi-gray-700/50 flex shrink-0 grow basis-1/2 flex-col items-center justify-center px-0 py-6 text-center md:items-start md:border-r md:px-14 md:py-16 md:text-left">
                <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl">
                  {component.title}
                </h1>

                <div className="flex flex-col items-start gap-0.5">
                  <div className="relative">
                    <TypingAnimation
                      className="text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl"
                      startDelay={3500}
                      startTyped
                      words={rotatingPhrases}
                    />
                    <div className="animate-hero-border-expand rounded-strapi-sm border-strapi-purple-500 pointer-events-none absolute bottom-0 left-0 h-0 w-0 border" />
                  </div>

                  <div className="animate-hero-use-case-reveal bg-strapi-purple-500 rounded-strapi-sm inline-block px-0.5 py-px text-[12px] font-medium text-white">
                    Use case
                  </div>
                </div>

                {component.description ? (
                  <p className="text-background/60 mt-6 text-sm leading-relaxed sm:text-base">
                    <InlineMarkdown>{component.description}</InlineMarkdown>
                  </p>
                ) : null}

                {component.cta?.code ? (
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
                <div className="animate-border-reveal animate-reveal-cascade border-strapi-gray-700/50 rounded-strapi-xl grid grow-0 grid-cols-1 grid-rows-[1fr_auto] max-md:border">
                  {component.testimonials.title ? (
                    <div className="border-strapi-gray-700/50 flex items-center justify-center border-b px-8 py-5 sm:px-16 sm:py-12">
                      <p className="text-strapi-gray-400 px-6 text-center text-base">
                        {component.testimonials.title}
                      </p>
                    </div>
                  ) : null}

                  {component.testimonials.logos?.length ? (
                    <TestimonialLogosGrid
                      logos={component.testimonials.logos}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasFeatures ? (
          <div className="animate-ring-reveal ring-strapi-gray-700/50 rounded-strapi-xl overflow-hidden ring [--reveal-delay:680ms]">
            <StrapiHeroHomeFeatures features={component.features} />
          </div>
        ) : null}
      </HeroContainerContent>
    </HeroContainer>
  )
}
