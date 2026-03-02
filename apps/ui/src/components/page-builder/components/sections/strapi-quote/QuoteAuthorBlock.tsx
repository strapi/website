import type { Data } from "@repo/strapi-types"

import { QuoteAuthor } from "@/components/elementary/quote"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export function QuoteAuthorBlock({
  component,
}: {
  readonly component: Data.Component<"sections.quote">
}) {
  return (
    <QuoteAuthor
      name={component.authorName}
      role={component.authorRole}
      avatar={
        component.authorAvatar && (
          <StrapiBasicImage
            component={component.authorAvatar}
            fill
            className="object-cover"
          />
        )
      }
      logo={
        component.companyLogo && (
          <StrapiBasicImage
            component={component.companyLogo}
            autoHeight
            className="max-h-5 w-auto"
          />
        )
      }
    />
  )
}
