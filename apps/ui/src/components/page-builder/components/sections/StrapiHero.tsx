import type { Data } from "@repo/strapi-types"

import { HeroContainer } from "@/components/elementary/HeroContainer"
import {
  SectionCTA,
  SectionHeader,
  SectionDescription,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
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
      <div className="border-strapi-gray-700/50 rounded-strapi-lg flex flex-col items-end overflow-hidden md:flex-row md:border md:pl-10 lg:gap-12">
        <SectionHeader
          className="animate-reveal-cascade px-8 py-8 md:py-16 lg:pr-0 lg:pl-12"
          layout="left"
          size="xl"
        >
          {component.label ? (
            <SectionLabel variant="default">{component.label}</SectionLabel>
          ) : null}

          <SectionTitle variant="inverse" as="h1" size="lg">
            {component.title}
          </SectionTitle>

          {component.description ? (
            <SectionDescription variant="inverse" size="lg">
              {component.description}
            </SectionDescription>
          ) : null}

          {component.ctas?.length ? (
            <SectionCTA spacing="lg">
              {component.ctas.map((cta) => (
                <StrapiLink key={cta.id} component={cta} />
              ))}
            </SectionCTA>
          ) : null}
        </SectionHeader>

        {component.image ? (
          <StrapiBasicImage
            component={component.image}
            mode="responsive"
            className="max-w-[640px]"
            sizes="(max-width: 768px) 100vw, 640px"
          />
        ) : null}
      </div>
    </HeroContainer>
  )
}
