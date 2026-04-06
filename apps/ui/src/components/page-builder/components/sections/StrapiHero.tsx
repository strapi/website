import type { Data } from "@repo/strapi-types"

import {
  HeroContainer,
  HeroContainerContent,
} from "@/components/elementary/HeroContainer"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import type { DynamicZoneRenderContext } from "@/components/page-builder/DynamicZoneRenderer"

interface StrapiHeroProps {
  readonly component: Data.Component<"sections.hero">
  readonly renderContext?: DynamicZoneRenderContext
}

export function StrapiHero({ component, renderContext }: StrapiHeroProps) {
  const affectsNavbarTheme =
    renderContext?.surface === "page" && renderContext.isFirst

  return (
    <HeroContainer affectsNavbarTheme={affectsNavbarTheme}>
      <HeroContainerContent>
        <div className="animate-ring-reveal ring-strapi-gray-700/50 rounded-strapi-xl overflow-hidden md:ring">
          <div className="md:bg-strapi-gray-950 rounded-strapi-xl flex w-full flex-col md:flex-row">
            <div className="animate-reveal-cascade animate-border-reveal border-strapi-gray-700/50 flex shrink-0 grow basis-1/2 flex-col items-start gap-5 px-8 py-8 text-left md:border-r md:px-14 md:py-16">
              {component.label ? (
                <span className="text-strapi-blue-600 text-sm font-bold tracking-wider uppercase">
                  {component.label}
                </span>
              ) : null}

              <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl">
                {component.title}
              </h1>

              {component.description ? (
                <p className="text-background/60 text-sm leading-relaxed sm:text-base">
                  <InlineMarkdown>{component.description}</InlineMarkdown>
                </p>
              ) : null}

              {component.ctas?.length ? (
                <div className="mt-6 flex flex-wrap gap-4">
                  {component.ctas.map((cta) => (
                    <StrapiLink key={cta.id} component={cta} />
                  ))}
                </div>
              ) : null}
            </div>

            {component.image ? (
              <div className="animate-border-reveal animate-reveal-cascade border-strapi-gray-700/50 flex shrink-0 grow basis-1/2 items-center justify-center overflow-hidden max-md:border-t">
                <StrapiBasicImage
                  component={component.image}
                  mode="responsive"
                  className="max-w-[640px]"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
            ) : null}
          </div>
        </div>
      </HeroContainerContent>
    </HeroContainer>
  )
}
