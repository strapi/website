"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/styles"

export interface FilterOption {
  readonly label: string
  readonly value: string
}

interface SearchFilterSidebarProps {
  readonly query: string
  readonly onQueryChange: (next: string) => void
  readonly searchPlaceholder: string
  readonly filterLabel?: string
  readonly filterOptions?: readonly FilterOption[]
  readonly selectedValues?: ReadonlySet<string>
  readonly onToggleValue?: (value: string) => void
  readonly idPrefix: string
  readonly className?: string
}

export function SearchFilterSidebar({
  query,
  onQueryChange,
  searchPlaceholder,
  filterLabel,
  filterOptions,
  selectedValues,
  onToggleValue,
  idPrefix,
  className,
}: SearchFilterSidebarProps) {
  const showFilters =
    filterOptions != null && filterOptions.length > 0 && filterLabel != null

  return (
    <aside
      className={cn("flex flex-col gap-6 lg:w-1/4 lg:shrink-0", className)}
    >
      <div className="relative">
        <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {showFilters && (
        <div className="flex flex-col gap-3">
          <p className="text-foreground text-sm font-semibold tracking-[0.5px] uppercase">
            {filterLabel}
          </p>

          <div className="flex flex-col gap-2">
            {filterOptions.map((option) => {
              const id = `${idPrefix}-${option.value}`
              const isChecked = selectedValues?.has(option.value) ?? false

              return (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={isChecked}
                    onCheckedChange={() => onToggleValue?.(option.value)}
                  />
                  <Label
                    htmlFor={id}
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
  )
}
