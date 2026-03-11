import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Quote, QuoteText, QuoteTriangle } from "@/components/elementary/quote"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

import { QuoteAuthorBlock } from "./QuoteAuthorBlock"

export function ImageQuote({
  component,
}: {
  readonly component: Data.Component<"testimonials.quote">
}) {
  return (
    <section className="py-24">
      <Container>
        <div className="relative pt-24">
          <QuoteTriangle className="hidden lg:block">
            {component.image?.media && (
              <StrapiBasicImage
                component={component.image}
                mode="fill"
                className="object-cover"
                sizes="(min-width: 1024px) 470px, 100vw"
                decorative
              />
            )}
          </QuoteTriangle>

          <div className="relative max-w-[470px]">
            <Quote size="lg">
              <QuoteText size="lg">{component.quote}</QuoteText>
              <QuoteAuthorBlock component={component} />
            </Quote>
          </div>
        </div>
      </Container>
    </section>
  )
}
