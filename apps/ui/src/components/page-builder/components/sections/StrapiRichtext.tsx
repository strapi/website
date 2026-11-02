import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Markdown } from "@/components/elementary/markdown/Markdown"

export function StrapiRichtext({
  component,
  embedded = false,
}: {
  readonly component: Data.Component<"sections.richtext">
  /** Skip the section container when the block already sits inside another layout. */
  readonly embedded?: boolean
}) {
  if (!component.content) return null

  const body = <Markdown>{component.content}</Markdown>

  if (embedded) {
    return body
  }

  return (
    <section>
      <Container>{body}</Container>
    </section>
  )
}
