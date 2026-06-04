import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Disclaimer } from "@/components/elementary/disclaimer/Disclaimer"

export function StrapiDisclaimer({
  component,
}: {
  readonly component: Data.Component<"sections.disclaimer">
}) {
  if (!component.title) return null

  return (
    <section>
      <Container>
        <Disclaimer title={component.title}>{component.content}</Disclaimer>
      </Container>
    </section>
  )
}
