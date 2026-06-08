import type { Data } from "@repo/strapi-types"

import { QuoteAuthor } from "@/components/elementary/quote"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export function QuoteAuthorBlock({
  component,
}: {
  readonly component: Data.Component<"testimonials.quote">
}) {
  return (
    <QuoteAuthor
      name={component.authorName}
      role={component.authorRole}
      avatar={
        component.authorAvatar && (
          <StrapiBasicImage
            component={component.authorAvatar}
            mode="fill"
            className="object-cover"
            sizes="64px"
            decorative
          />
        )
      }
      logo={
        component.companyLogo && (
          <StrapiBasicImage
            component={component.companyLogo}
            mode="responsive"
            className="max-h-5 w-auto self-start"
            sizes="80px"
          />
        )
      }
    />
  )
}
