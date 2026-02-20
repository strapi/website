import type { Data } from "@repo/strapi-types"
import type { Locale } from "next-intl"
import { use } from "react"

import { fetchFooter } from "@/lib/strapi-api/content/server"

import { StrapiFooterCta } from "./StrapiFooterCta"
import { StrapiFooterMain } from "./StrapiFooterMain"

export function StrapiFooter({ locale }: { readonly locale: Locale }) {
  const response = use(fetchFooter(locale))
  const content = response?.data?.content

  if (content == null || content.length === 0) {
    return null
  }

  // TODO this should use same ideas as the urrent pages "page"
  return (
    <footer>
      {content.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic zone items carry __component at runtime; union type not yet narrowable without explicit cast
        const block = item as any

        if (block.__component === "sections.footer-cta") {
          return (
            <StrapiFooterCta
              key={`${block.__component}-${block.id}`}
              component={block as Data.Component<"sections.footer-cta">}
            />
          )
        }

        if (block.__component === "sections.footer-main") {
          return (
            <StrapiFooterMain
              key={`${block.__component}-${block.id}`}
              component={block as Data.Component<"sections.footer-main">}
            />
          )
        }

        return null
      })}
    </footer>
  )
}
