import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { ContentCard } from "@/components/elementary/content-card/ContentCard"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"

export function StrapiContentCard({
  component,
}: {
  readonly component: Data.Component<"cards.content-card">
}) {
  if (!component.title) {
    return null
  }

  return (
    <Container>
      <ContentCard label={component.label} title={component.title}>
        <InlineMarkdown>{component.content}</InlineMarkdown>
      </ContentCard>
    </Container>
  )
}
