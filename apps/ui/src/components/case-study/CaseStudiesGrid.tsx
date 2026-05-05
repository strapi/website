"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function deriveCategoryOptions(
  items: readonly CaseStudyHit[]
): readonly { label: string; value: string }[] {
  const seen = new Map<string, string>()

  for (const item of items) {
    if (!item.categories) continue

    for (const cat of item.categories) {
      if (cat?.slug && cat.name && !seen.has(cat.slug)) {
        seen.set(cat.slug, cat.name)
      }
    }
  }

  return [...seen.entries()].map(([value, label]) => ({ label, value }))
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
  const [isPending, startTransition] = useTransition()

  const categoryOptions = useMemo(() => deriveCategoryOptions(hits), [hits])

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
    })
  }

  const hasMore = hits.length < total

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row", className)}>
      <aside className="flex flex-col gap-6 lg:w-1/4 lg:shrink-0">
        <div className="relative">
          <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {categoryOptions.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-foreground text-sm font-semibold tracking-[0.5px] uppercase">
              {t("filterCategoriesLabel")}
            </p>

            <div className="flex flex-col gap-2">
              {categoryOptions.map((option) => {
                const isChecked = selectedCategories.has(option.value)

                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`case-study-category-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleCategory(option.value)}
                    />
                    <Label
                      htmlFor={`case-study-category-${option.value}`}
                      className="cursor-pointer text-base font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

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
