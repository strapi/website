import type { Locale } from "next-intl"

import { StrapiStructuredData } from "@/components/page-builder/components/seo-utilities/StrapiStructuredData"
import { generateBreadcrumbListSchema } from "@/lib/metadata/schemas"
import type { BreadCrumb } from "@/types/api"

interface Props {
  readonly breadcrumbs?: BreadCrumb[]
  readonly locale: Locale
}

export function Breadcrumbs({ breadcrumbs, locale }: Props) {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null
  }

  const breadcrumbListSchema = generateBreadcrumbListSchema(breadcrumbs, locale)

  return <StrapiStructuredData structuredData={breadcrumbListSchema} />
}
