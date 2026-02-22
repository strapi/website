import type { Locale } from "next-intl"
import { use } from "react"

import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { fetchFooter } from "@/lib/strapi-api/content/server"

export function StrapiFooter({ locale }: { readonly locale: Locale }) {
  const response = use(fetchFooter(locale))
  const content = response?.data?.content

  if (content == null || content.length === 0) {
    return null
  }

  return (
    <footer>
      <DynamicZoneRenderer content={content} />
    </footer>
  )
}
