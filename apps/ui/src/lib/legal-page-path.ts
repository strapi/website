import type { Data } from "@repo/strapi-types"

export type LegalPagePanelEntry = {
  readonly title?: string | null
  readonly slug?: string | null
  readonly content?: string | null
  readonly seo?: Data.Component<"shared.seo"> | null
}

/** Public path of a legal page nested one segment under its host page. */
export function legalPagePath(parentFullPath: string, slug: string) {
  const base = parentFullPath.replace(/\/$/, "")

  return `${base}/${slug}`
}
