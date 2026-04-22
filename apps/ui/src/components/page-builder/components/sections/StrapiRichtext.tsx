import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Markdown } from "@/components/elementary/markdown/Markdown"

export function StrapiRichtext({
  component,
}: {
  readonly component: Data.Component<"sections.richtext">
}) {
  if (!component.content) return null

  return (
    <section className="py-8 lg:py-12">
      <Container>
        <Markdown>{component.content}</Markdown>
      </Container>
    </section>
  )
}
