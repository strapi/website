"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import { useMemo, useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/styles"

const PAGE_SIZE = 12

function itemMatchesGroup<T extends Record<string, unknown>>(
  item: T,
  sel: Set<string>
): boolean {
  return Object.values(item).some((v) => sel.has(String(v)))
}

export interface FilterOption {
  readonly label: string
  readonly value: string
}

export interface FilterGroup {
  readonly label: string
  readonly options: readonly FilterOption[]
}

export interface FilterableCardGridProps<T extends Record<string, unknown>> {
  readonly items: readonly T[]
  readonly columns?: 2 | 3
  readonly renderItem: (item: T, index: number) => React.ReactNode
  readonly filters?: readonly FilterGroup[]
  readonly searchKey?: keyof T
  readonly searchPlaceholder?: string
  readonly showLoadMore?: boolean
  readonly className?: string
}

export function FilterableCardGrid<T extends Record<string, unknown>>({
  items,
  columns = 3,
  renderItem,
  filters,
  searchKey,
  searchPlaceholder = "Search...",
  showLoadMore = true,
  className,
}: FilterableCardGridProps<T>) {
  const [query, setQuery] = useState("")
  const [groupSelected, setGroupSelected] = useState<Map<string, Set<string>>>(
    new Map()
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const hasSidebar =
    searchKey != null || (filters != null && filters.length > 0)

  const filtered = useMemo(() => {
    let result = [...items]

    if (searchKey != null && query.trim() !== "") {
      const q = query.toLowerCase()

      result = result.filter((item) => {
        const val = item[searchKey]

        return typeof val === "string" && val.toLowerCase().includes(q)
      })
    }

    if (filters != null) {
      const activeGroups = filters.filter((g) => {
        const sel = groupSelected.get(g.label)

        return sel != null && sel.size > 0
      })

      if (activeGroups.length > 0) {
        result = result.filter((item) =>
          activeGroups.every((group) => {
            const sel = groupSelected.get(group.label)!

            return itemMatchesGroup(item, sel)
          })
        )
      }
    }

    return result
  }, [items, query, searchKey, filters, groupSelected])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  function toggleValue(groupLabel: string, value: string) {
    setGroupSelected((prev) => {
      const next = new Map(prev)
      const groupSet = new Set(next.get(groupLabel))

      if (groupSet.has(value)) {
        groupSet.delete(value)
      } else {
        groupSet.add(value)
      }

      next.set(groupLabel, groupSet)

      return next
    })
    setVisibleCount(PAGE_SIZE)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setVisibleCount(PAGE_SIZE)
  }

  const colClass = columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row", className)}>
      {hasSidebar && (
        <aside className="flex flex-col gap-6 lg:w-1/4 lg:shrink-0">
          {searchKey != null && (
            <div className="relative">
              <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder={searchPlaceholder}
                value={query}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
          )}

          {filters?.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <p className="typo-label text-foreground">{group.label}</p>

              <div className="flex flex-col gap-2">
                {group.options.map((option) => {
                  const isChecked =
                    groupSelected.get(group.label)?.has(option.value) ?? false

                  return (
                    <div key={option.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`filter-${group.label}-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={() =>
                          toggleValue(group.label, option.value)
                        }
                      />
                      <Label
                        htmlFor={`filter-${group.label}-${option.value}`}
                        className="text-strapi-body-2 cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", colClass)}>
          {visible.map((item, index) => renderItem(item, index))}
        </div>

        {showLoadMore && hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              See more
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
