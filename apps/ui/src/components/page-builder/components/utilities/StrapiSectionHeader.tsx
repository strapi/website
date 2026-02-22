import type { Data } from "@repo/strapi-types"

import { Markdown } from "@/components/elementary/markdown/Markdown"
import {
  SectionDescription,
  SectionHeader,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

export interface StrapiSectionHeaderProps {
  readonly component: Data.Component<"utilities.section-header">
  readonly className?: string
}

export function StrapiSectionHeader({
  component,
  className,
}: StrapiSectionHeaderProps) {
  console.log({ component })

  return (
    <SectionHeader
      layout={component.layout}
      size={component.size}
      className={className}
    >
      <SectionLabel variant={component.variant} image={component.labelIcon}>
        {component.label}
      </SectionLabel>

      <SectionTitle size={component.size} variant={component.variant}>
        {component.title}
      </SectionTitle>

      <SectionDescription variant={component.variant}>
        <Markdown>{component.description}</Markdown>
      </SectionDescription>

      {component.ctaLinks && component.ctaLinks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-4">
          {component.ctaLinks.map((link) => (
            <StrapiLink key={link.id} component={link} />
          ))}
        </div>
      )}
    </SectionHeader>
  )
}
