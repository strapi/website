"use client"

import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { SearchFilterSidebar } from "@/components/elementary/SearchFilterSidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/styles"

import type {
  CaseStudyHit,
  SearchCaseStudiesArgs,
} from "./case-studies-search-types"
import { CaseStudyCard } from "./CaseStudyCard"

type CaseStudy = Data.ContentType<"api::case-study.case-study">

interface CaseStudiesGridProps {
  readonly locale: string
  readonly initialHits: readonly CaseStudyHit[]
  readonly initialTotal: number
  readonly pageSize?: number
  readonly searchAction: (
    args: SearchCaseStudiesArgs
  ) => Promise<{ hits: readonly CaseStudyHit[]; total: number }>
  readonly className?: string
}

const DEFAULT_PAGE_SIZE = 12

function collectCategories(
  into: Map<string, string>,
  items: readonly CaseStudyHit[]
): Map<string, string> {
  for (const item of items) {
    // Meilisearch hits can carry `categories` as a non-array (or omit it), so
    // guard with Array.isArray to avoid a "not iterable" crash at prerender.
    if (!Array.isArray(item.categories)) continue

    for (const cat of item.categories) {
      if (cat?.slug && cat.name && !into.has(cat.slug)) {
        into.set(cat.slug, cat.name)
      }
    }
  }

  return into
}

export function CaseStudiesGrid({
  locale,
  initialHits,
  initialTotal,
  pageSize = DEFAULT_PAGE_SIZE,
  searchAction,
  className,
}: CaseStudiesGridProps) {
  const t = useTranslations("caseStudies")

  const [hits, setHits] = useState<readonly CaseStudyHit[]>(initialHits)
  const [total, setTotal] = useState(initialTotal)
  const [query, setQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<
    ReadonlySet<string>
  >(new Set())
  const [knownCategories, setKnownCategories] = useState<
    ReadonlyMap<string, string>
  >(() => collectCategories(new Map(), initialHits))
  const [isPending, startTransition] = useTransition()

  const categoryOptions = useMemo(
    () =>
      [...knownCategories.entries()].map(([value, label]) => ({
        label,
        value,
      })),
    [knownCategories]
  )

  function mergeCategories(items: readonly CaseStudyHit[]) {
    setKnownCategories((prev) => {
      const next = collectCategories(new Map(prev), items)

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
          categorySlugs: [...selectedCategories],
          offset: 0,
          limit: pageSize,
        })

        setHits(res.hits)
        setTotal(res.total)
        mergeCategories(res.hits)
      })
    }, 200)

    return () => clearTimeout(handle)
  }, [query, selectedCategories, locale, pageSize, searchAction])

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)

      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }

      return next
    })
  }

  function loadMore() {
    startTransition(async () => {
      const res = await searchAction({
        locale,
        query,
        categorySlugs: [...selectedCategories],
        offset: hits.length,
        limit: pageSize,
      })

      setHits((prev) => [...prev, ...res.hits])
      setTotal(res.total)
      mergeCategories(res.hits)
    })
  }

  const hasMore = hits.length < total

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row", className)}>
      <SearchFilterSidebar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={t("searchPlaceholder")}
        filterLabel={t("filterCategoriesLabel")}
        filterOptions={categoryOptions}
        selectedValues={selectedCategories}
        onToggleValue={toggleCategory}
        idPrefix="case-study-category"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((item) => (
            <CaseStudyCard
              key={item.documentId ?? item.slug}
              caseStudy={item as unknown as CaseStudy}
            />
          ))}
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
