"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/styles"

import { CaseStudyCard } from "./CaseStudyCard"

type CaseStudy = Data.ContentType<"api::case-study.case-study">

interface CaseStudyCategory {
  readonly name?: string | null
  readonly slug?: string | null
}

interface CaseStudiesGridProps {
  readonly items: readonly CaseStudy[]
  readonly className?: string
}

const PAGE_SIZE = 12

function deriveCategoryOptions(
  items: readonly CaseStudy[]
): readonly { label: string; value: string }[] {
  const seen = new Map<string, string>()

  for (const item of items) {
    const categories = (item as { categories?: readonly CaseStudyCategory[] })
      .categories

    if (!categories) continue

    for (const cat of categories) {
      if (cat?.slug && cat.name && !seen.has(cat.slug)) {
        seen.set(cat.slug, cat.name)
      }
    }
  }

  return [...seen.entries()].map(([value, label]) => ({ label, value }))
}

function itemMatchesCategories(
  item: CaseStudy,
  selected: ReadonlySet<string>
): boolean {
  if (selected.size === 0) return true

  const categories = (item as { categories?: readonly CaseStudyCategory[] })
    .categories

  if (!categories || categories.length === 0) return false

  return categories.some((c) => c?.slug != null && selected.has(c.slug))
}

export function CaseStudiesGrid({ items, className }: CaseStudiesGridProps) {
  const t = useTranslations("caseStudies")

  const [query, setQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<
    ReadonlySet<string>
  >(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const categoryOptions = useMemo(() => deriveCategoryOptions(items), [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return items.filter((item) => {
      if (q.length > 0) {
        const title = item.title?.toLowerCase() ?? ""

        if (!title.includes(q)) return false
      }

      return itemMatchesCategories(item, selectedCategories)
    })
  }, [items, query, selectedCategories])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

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
    setVisibleCount(PAGE_SIZE)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row", className)}>
      <aside className="flex flex-col gap-6 lg:w-1/4 lg:shrink-0">
        <div className="relative">
          <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={handleSearchChange}
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
          {visible.map((item) => (
            <CaseStudyCard key={item.slug} caseStudy={item} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
