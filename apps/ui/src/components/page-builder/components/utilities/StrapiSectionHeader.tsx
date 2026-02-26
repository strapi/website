import type { Data } from "@repo/strapi-types"

import {
  SectionCTA,
  SectionDescription,
  SectionHeader,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

export interface StrapiSectionHeaderProps {
  readonly component: Data.Component<"utilities.section-header">
  readonly className?: string
  readonly variantOverride?: "default" | "inverse" | "purple"
}

export function StrapiSectionHeader({
  component,
  className,
  variantOverride,
}: StrapiSectionHeaderProps) {
  const variant = variantOverride ?? component.variant ?? "default"

  return (
    <SectionHeader
      layout={component.layout}
      size={component.size}
      className={className}
    >
      <SectionLabel
        size={component.size}
        variant={variant}
        image={component.labelIcon}
      >
        {component.label}
      </SectionLabel>

      <SectionTitle size={component.size} variant={variant}>
        {component.title}
      </SectionTitle>

      <SectionDescription size={component.size} variant={variant}>
        {component.description}
      </SectionDescription>

      {component.ctaLinks && component.ctaLinks.length > 0 && (
        <SectionCTA layout={component.layout} spacing="lg">
          {component.ctaLinks.map((link: Data.Component<"utilities.link">) => (
            <StrapiLink key={link.id} component={link} />
          ))}
        </SectionCTA>
      )}
    </SectionHeader>
  )
}
