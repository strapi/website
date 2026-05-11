"use client"

import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { SearchFilterSidebar } from "@/components/elementary/SearchFilterSidebar"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

import type {
  FeaturePageHit,
  SearchFeaturePagesArgs,
} from "./feature-pages-search-types"

interface FeaturePagesGridProps {
  readonly locale: string
  readonly initialHits: readonly FeaturePageHit[]
  readonly initialTotal: number
  readonly pageSize?: number
  readonly searchAction: (
    args: SearchFeaturePagesArgs
  ) => Promise<{ hits: readonly FeaturePageHit[]; total: number }>
  readonly className?: string
}

const DEFAULT_PAGE_SIZE = 12

function collectTags(
  into: Set<string>,
  items: readonly FeaturePageHit[]
): Set<string> {
  for (const item of items) {
    if (item.feature_tag) into.add(item.feature_tag)
  }

  return into
}

export function FeaturePagesGrid({
  locale,
  initialHits,
  initialTotal,
  pageSize = DEFAULT_PAGE_SIZE,
  searchAction,
  className,
}: FeaturePagesGridProps) {
  const t = useTranslations("features")

  const [hits, setHits] = useState<readonly FeaturePageHit[]>(initialHits)
  const [total, setTotal] = useState(initialTotal)
  const [query, setQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<ReadonlySet<string>>(
    new Set()
  )
  const [knownTags, setKnownTags] = useState<ReadonlySet<string>>(() =>
    collectTags(new Set(), initialHits)
  )
  const [isPending, startTransition] = useTransition()

  const tagOptions = useMemo(() => [...knownTags], [knownTags])

  function mergeTags(items: readonly FeaturePageHit[]) {
    setKnownTags((prev) => {
      const next = collectTags(new Set(prev), items)

      return next.size === prev.size ? prev : next
    })
  }

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }

    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchAction({
          locale,
          query,
          featureTagTitles: [...selectedTags],
          offset: 0,
          limit: pageSize,
        })

        setHits(res.hits)
        setTotal(res.total)
        mergeTags(res.hits)
      })
    }, 200)

    return () => clearTimeout(handle)
  }, [query, selectedTags, locale, pageSize, searchAction])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)

      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }

      return next
    })
  }

  function loadMore() {
    startTransition(async () => {
      const res = await searchAction({
        locale,
        query,
        featureTagTitles: [...selectedTags],
        offset: hits.length,
        limit: pageSize,
      })

      setHits((prev) => [...prev, ...res.hits])
      setTotal(res.total)
      mergeTags(res.hits)
    })
  }

  const hasMore = hits.length < total

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row", className)}>
      <SearchFilterSidebar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={t("searchPlaceholder")}
        filterLabel={t("filterTagsLabel")}
        filterOptions={tagOptions.map((tag) => ({ label: tag, value: tag }))}
        selectedValues={selectedTags}
        onToggleValue={toggleTag}
        idPrefix="feature-tag"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((item) => {
            const href = item.url ?? ""
            const isExternal = /^https?:\/\//.test(href)
            const iconComponent = item.icon
              ? ({
                  media: item.icon,
                  alt: item.icon.alternativeText ?? item.title,
                } as unknown as Data.Component<"utilities.basic-image">)
              : null

            return (
              <Card key={item.documentId ?? item.title} className="relative">
                {item.feature_tag && (
                  <span className="bg-strapi-blue-100 text-strapi-blue-600 absolute top-3 left-3 rounded-sm px-2 py-0.5 text-xs font-medium">
                    {item.feature_tag}
                  </span>
                )}

                <Link
                  href={href || "#"}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="group flex h-full flex-col items-center justify-center pt-10 no-underline"
                >
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    {iconComponent && (
                      <StrapiBasicImage
                        component={iconComponent}
                        mode="responsive"
                        sizes="40px"
                        className="size-10"
                        hideWhenMissing
                      />
                    )}

                    <h3 className="text-foreground text-lg font-bold">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-muted-foreground line-clamp-3 text-sm">
                        {item.description}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={isPending}>
              {isPending ? `${t("loadMore")}…` : t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
