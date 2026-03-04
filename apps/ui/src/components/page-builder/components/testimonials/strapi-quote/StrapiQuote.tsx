import type { Data } from "@repo/strapi-types"

import { BoxedQuote } from "./BoxedQuote"
import { ImageQuote } from "./ImageQuote"

export function StrapiQuote({
  component,
}: {
  readonly component: Data.Component<"testimonials.quote">
}) {
  if (component.variant === "image") {
    return <ImageQuote component={component} />
  }

  return <BoxedQuote component={component} />
}
