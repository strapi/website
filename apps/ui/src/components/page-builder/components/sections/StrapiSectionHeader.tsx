import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

import { StrapiSectionHeader as UtilityStrapiSectionHeader } from "../utilities/StrapiSectionHeader"

export function StrapiSectionHeader({
  component,
}: {
  readonly component: Data.Component<"sections.section-header">
}) {
  if (!component.section) {
    return null
  }

  return (
    <Container>
      <UtilityStrapiSectionHeader component={component.section} />
    </Container>
  )
}
