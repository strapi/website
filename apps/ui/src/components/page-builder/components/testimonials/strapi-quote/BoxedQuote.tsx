import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Quote, QuoteText } from "@/components/elementary/quote"

import { QuoteAuthorBlock } from "./QuoteAuthorBlock"

export function BoxedQuote({
  component,
}: {
  readonly component: Data.Component<"testimonials.quote">
}) {
  return (
    <section className="py-24">
      <Container>
        <div className="rounded-strapi-lg max-w-[790px] overflow-hidden bg-white px-14 py-10 shadow-md">
          <Quote>
            <QuoteText>{component.quote}</QuoteText>
            <QuoteAuthorBlock component={component} />
          </Quote>
        </div>
      </Container>
    </section>
  )
}
