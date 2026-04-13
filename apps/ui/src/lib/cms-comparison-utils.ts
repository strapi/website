export interface CMSEntry {
  name: string
  slug: string
  logo: { url: string; width: number; height: number } | null
  fields?: {
    name: string
    category: string
    mark: boolean
    text: string | null
  }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCmsEntries(data: any[]): CMSEntry[] {
  return (data ?? []).map((cms) => ({
    name: cms.name,
    slug: cms.slug,
    logo: cms.logo
      ? { url: cms.logo.url, width: cms.logo.width, height: cms.logo.height }
      : null,
    fields: cms.fields ?? [],
  }))
}

export interface FormattedComparator {
  slug: string
  firstCMS: CMSEntry
  secondCMS: CMSEntry
}

export function parseComparatorSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-")

  if (parts.length !== 2) return null

  const [first, second] = parts
  if (!first || !second) return null

  return [first, second]
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replaceAll("-", "")
}

export function findCMSBySlug(
  cmsSlug: string,
  allCMS: CMSEntry[]
): CMSEntry | undefined {
  const normalized = normalizeSlug(cmsSlug)

  return allCMS.find((cms) => normalizeSlug(cms.slug) === normalized)
}

/**
 * Builds a formatted comparator with matched CMS data.
 * Always puts Strapi as firstCMS when it's one of the pair.
 */
export function buildComparatorWithCMS(
  comparator: { slug: string },
  allCMS: CMSEntry[]
): FormattedComparator | null {
  const slugParts = parseComparatorSlug(comparator.slug)
  if (!slugParts) return null

  const [firstSlugPart, secondSlugPart] = slugParts
  const firstMatch = findCMSBySlug(firstSlugPart, allCMS)
  const secondMatch = findCMSBySlug(secondSlugPart, allCMS)

  if (!firstMatch || !secondMatch) return null

  const isFirstStrapi = firstMatch.name.toLowerCase() === "strapi"
  const [first, second] = isFirstStrapi
    ? [firstMatch, secondMatch]
    : [secondMatch, firstMatch]

  return { slug: comparator.slug, firstCMS: first, secondCMS: second }
}
