"use client"

import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import { Container } from "@/components/elementary/Container"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiSectionHeader } from "@/components/page-builder/components/utilities/StrapiSectionHeader"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/dates"
import { cn } from "@/lib/styles"

type NewsItem = Data.Component<"elements.news-item">

function NewsRow({ item }: { readonly item: NewsItem }) {
  return (
    <HeroContainerBorder asChild>
      <div
        className={cn(
          "group/news-row relative grid items-center gap-x-4 gap-y-3 px-5 py-4 transition-[border-color] duration-300 sm:px-8",
          "grid-cols-[auto_1fr] lg:grid-cols-[1fr_7rem_9rem]",
          "before:gradient-border-purple before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
          "hover:border-transparent hover:before:opacity-100"
        )}
      >
        <a
          href={item.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 pr-4 text-base text-white lg:col-span-1 lg:pr-8 lg:text-lg"
        >
          <span className="underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover/news-row:decoration-white">
            {item.title}
          </span>
        </a>

        <div className="flex justify-start lg:col-auto">
          {item.logo ? (
            <div className="relative h-6 w-24">
              <StrapiBasicImage
                component={item.logo}
                mode="fill"
                className="object-contain object-left"
                sizes="96px"
              />
            </div>
          ) : (
            item.source && (
              <span className="text-strapi-gray-400 text-sm font-semibold tracking-wider uppercase">
                {item.source}
              </span>
            )
          )}
        </div>

        <span className="text-strapi-gray-400 text-left text-sm whitespace-nowrap sm:text-right lg:text-base">
          {item.date ? formatDate(item.date, "MMMM D, YYYY") : ""}
        </span>
      </div>
    </HeroContainerBorder>
  )
}

export function StrapiNewsList({
  component,
}: {
  readonly component: Data.Component<"sections.news-list">
}) {
  const pageSize = component.pageSize ?? 10
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const items = component.items ?? []
  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return (
    <section className="bg-strapi-gray-950 py-16 lg:py-24">
      <Container className="flex flex-col gap-10">
        {component.section && (
          <StrapiSectionHeader
            component={component.section}
            variantOverride="inverse"
          />
        )}

        {visibleItems.length > 0 && (
          <div className="flex flex-col gap-4">
            {visibleItems.map((item) => (
              <NewsRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <Button onClick={() => setVisibleCount((c) => c + pageSize)}>
              {component.loadMoreLabel ?? "Load More"}
            </Button>
          </div>
        )}
      </Container>
    </section>
  )
}
