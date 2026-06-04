import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { ContentCard } from "@/components/elementary/content-card/ContentCard"
import { BlogMarkdown } from "@/components/elementary/markdown/BlogMarkdown"

export function StrapiContentCard({
  component,
}: {
  readonly component: Data.Component<"cards.content-card">
}) {
  if (!component.title) {
    return null
  }

  return (
    <Container variant="condensed">
      <ContentCard label={component.label} title={component.title}>
        <BlogMarkdown>{component.content}</BlogMarkdown>
      </ContentCard>
    </Container>
  )
}
