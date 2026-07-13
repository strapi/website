import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import { getTranslations } from "next-intl/server"

import { AppLink } from "@/components/elementary/AppLink"
import { Container } from "@/components/elementary/Container"
import { ImageWithBlur } from "@/components/elementary/ImageWithBlur"
import { Card } from "@/components/ui/card"
import {
  type CMSEntry,
  type FormattedComparator,
  buildComparatorWithCMS,
  mapCmsEntries,
} from "@/lib/cms-comparison-utils"
import { logNonBlockingError } from "@/lib/logging"
import { Link } from "@/lib/navigation"
import { PublicStrapiClient } from "@/lib/strapi-api"
import { STRAPI_TAGS } from "@/lib/strapi-api/content/server"
import { formatStrapiMediaUrl } from "@/lib/strapi-helpers"
import { cn } from "@/lib/styles"

async function fetchComparatorData() {
  try {
    /**
     * Both fetches are tagged so cms/cms-comparison publishes expire them
     * (and the routes that rendered the grid) — untagged entries would
     * survive in the data cache and re-renders would bake the old grid in.
     */
    const [comparisonsRes, cmsRes] = await Promise.all([
      PublicStrapiClient.fetchAll(
        "api::cms-comparison.cms-comparison",
        {
          fields: ["slug"],
          status: "published",
        },
        { next: { tags: [...STRAPI_TAGS.cmsComparison] } }
      ),
      PublicStrapiClient.fetchAll(
        "api::cms.cms",
        {
          fields: ["name", "slug"],
          populate: {
            logo: { fields: ["url", "width", "height", "alternativeText"] },
          },
          status: "published",
        },
        { next: { tags: [...STRAPI_TAGS.cms] } }
      ),
    ])

    const allCMS = mapCmsEntries(cmsRes.data ?? [])

    const comparators = (comparisonsRes.data ?? [])
      .map((c: any) => buildComparatorWithCMS({ slug: c.slug }, allCMS))
      .filter(Boolean) as FormattedComparator[]

    return comparators
  } catch (error) {
    logNonBlockingError("Failed to fetch comparator data", { error })

    return []
  }
}

function CMSLogo({
  cms,
  className,
}: {
  readonly cms: CMSEntry
  readonly className?: string
}) {
  const src = formatStrapiMediaUrl(cms.logo?.url)
  if (!src) return <span className="text-sm font-semibold">{cms.name}</span>

  return (
    <ImageWithBlur
      src={src}
      alt={cms.name}
      width={cms.logo!.width}
      height={cms.logo!.height}
      className={cn("w-auto object-contain", className ?? "max-h-10")}
      transparentPlaceholder
    />
  )
}

function ComparatorCard({
  comparator,
  vsLabel,
}: {
  readonly comparator: FormattedComparator
  readonly vsLabel: string
}) {
  return (
    <Link
      href={`/headless-cms/comparison/${comparator.slug}`}
      className="group/card no-underline"
    >
      <Card className="flex h-full flex-col items-center justify-center gap-6 p-6 lg:gap-8 lg:p-8">
        <div className="flex h-10 items-center">
          <CMSLogo cms={comparator.firstCMS} />
        </div>

        <span className="bg-strapi-neutral-100 text-strapi-neutral-600 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold">
          {vsLabel}
        </span>

        <div className="flex h-10 items-center">
          <CMSLogo cms={comparator.secondCMS} />
        </div>
      </Card>
    </Link>
  )
}

export { CMSLogo }

export async function StrapiComparatorGrid({
  filterBySlugs,
}: {
  readonly filterBySlugs?: string[]
} = {}) {
  const [comparatorsData, t] = await Promise.all([
    fetchComparatorData(),
    getTranslations("cmsComparison"),
  ])

  let comparators = comparatorsData

  if (filterBySlugs && filterBySlugs.length > 0) {
    comparators = comparators.filter((c) =>
      filterBySlugs.some((slug) => c.slug.includes(slug))
    )
  }

  if (comparators.length === 0) return null

  return (
    <section className="py-8 lg:py-16">
      <Container>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">{t("compare")}</h2>
          <AppLink
            href="/headless-cms/comparison"
            variant="link"
            endAdornment={<ArrowRightIcon className="size-4" weight="bold" />}
          >
            {t("seeAll")}
          </AppLink>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {comparators.map((comparator) => (
            <ComparatorCard
              key={comparator.slug}
              comparator={comparator}
              vsLabel={t("vs")}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
