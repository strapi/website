import type { Locale } from "next-intl"
import { use } from "react"

import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { fetchHeader } from "@/lib/strapi-api/content/server"

export function StrapiHeader({ locale }: { readonly locale: Locale }) {
  const response = use(fetchHeader(locale))
  const content = response?.data?.content

  if (content == null || content.length === 0) {
    return null
  }

  return <DynamicZoneRenderer content={content} />
}
