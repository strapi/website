import type { Data } from "@repo/strapi-types"
import type { Locale } from "next-intl"
import { getLocale } from "next-intl/server"

import { Container } from "@/components/elementary/Container"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import { formatDate } from "@/lib/dates"
import { logNonBlockingError } from "@/lib/logging"
import { Link } from "@/lib/navigation"
import { PublicStrapiClient } from "@/lib/strapi-api"
import { cn } from "@/lib/styles"

// `Result<>` strips component-typed attributes from the API response, so we
// shape the populated payload explicitly. Matches `populate` below.
export type PopulatedNewsItem = {
  readonly id: number | string
  readonly documentId: string
  readonly date?: string | null
  readonly link?: Data.Component<"utilities.link"> | null
  readonly thumbnail?: Data.Component<"media.image"> | null
}

async function fetchNewsItems(locale: Locale): Promise<PopulatedNewsItem[]> {
  try {
    const response = await PublicStrapiClient.fetchMany(
      "api::news-item.news-item",
      {
        locale,
        populate: {
          link: {
            populate: {
              page: { fields: ["fullPath"] },
              decorations: true,
            },
          },
          thumbnail: {
            populate: {
              image: { populate: { media: true } },
            },
          },
        },
        sort: ["date:desc", "publishedAt:desc"],
        status: "published",
        pagination: { page: 1, pageSize: 100 },
      } as unknown as Parameters<typeof PublicStrapiClient.fetchMany>[1]
    )

    return (response.data ?? []) as unknown as PopulatedNewsItem[]
  } catch (error) {
    logNonBlockingError("Failed to fetch news items for StrapiNewsList", {
      error,
    })

    return []
  }
}

function NewsListRow({ item }: { readonly item: PopulatedNewsItem }) {
  const href = getStrapiLinkHref(item.link)
  const title = item.link?.label?.trim()

  if (!href || !title) {
    return null
  }

  const openInNewTab = item.link?.newTab ?? false

  return (
    <li>
      <HeroContainerBorder asChild>
        <Link
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noopener noreferrer" : undefined}
          className={cn(
            "group/news-row relative grid items-center gap-x-4 gap-y-2 px-5 py-4 transition-[border-color] duration-300 sm:px-8",
            "grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] lg:grid-cols-[7rem_1fr_9rem]",
            "before:gradient-border-purple before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
            "hover:border-transparent hover:before:opacity-100"
          )}
        >
          <div className="flex h-8 items-center sm:h-10 lg:h-12">
            {item.thumbnail?.image && (
              <StrapiBasicImage
                component={item.thumbnail.image}
                mode="intrinsic"
                className="max-h-full w-auto max-w-full object-contain"
                hideWhenMissing
              />
            )}
          </div>

          <span className="truncate pr-2 text-base sm:pr-4 lg:pr-8 lg:text-lg">
            <span className="group-hover/news-row:decoration-strapi-blue-800 decoration-strapi-blue-800/0 underline underline-offset-4 transition-[text-decoration-color] duration-300">
              {title}
            </span>
          </span>

          <span className="text-strapi-gray-400 text-right text-sm whitespace-nowrap lg:text-base">
            {item.date ? formatDate(item.date, "MMMM D, YYYY") : ""}
          </span>
        </Link>
      </HeroContainerBorder>
    </li>
  )
}

/**
 * Pure presentational news list. Accepts pre-fetched items so it can be reused
 * by the dev component library with mock data.
 */
export function NewsListView({
  items,
}: {
  readonly items: readonly PopulatedNewsItem[]
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <Container>
        <ul className="flex list-none flex-col gap-4 pl-0">
          {items.map((item) => (
            <NewsListRow key={item.documentId} item={item} />
          ))}
        </ul>
      </Container>
    </section>
  )
}

export async function StrapiNewsList(_: {
  readonly component: Data.Component<"sections.news-list">
}) {
  const locale = await getLocale()
  const items = await fetchNewsItems(locale)

  return <NewsListView items={items} />
}
