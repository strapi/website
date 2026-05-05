"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import { Command } from "cmdk"
import { useLocale } from "next-intl"
import { useEffect, useState, useTransition } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "@/lib/navigation"
import { cn } from "@/lib/styles"

import { globalSearch } from "./global-search-action"
import type { GlobalSearchResult } from "./global-search-types"

interface GlobalSearchModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

const EMPTY_RESULT: GlobalSearchResult = {
  caseStudies: [],
  pages: [],
  blogPosts: [],
}

const itemClass = cn(
  "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
  "flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-sm outline-none"
)

const groupClass = cn(
  "[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
)

export function GlobalSearchModal({
  open,
  onOpenChange,
}: GlobalSearchModalProps) {
  const locale = useLocale()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult>(EMPTY_RESULT)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length === 0) return

    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch({ query: trimmed, locale })

        setResults(res)
      })
    }, 200)

    return () => clearTimeout(handle)
  }, [query, locale])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("")
      setResults(EMPTY_RESULT)
    }

    onOpenChange(next)
  }

  function navigateAndClose(href: string) {
    handleOpenChange(false)
    router.push(href)
  }

  const hasAny =
    results.caseStudies.length > 0 ||
    results.pages.length > 0 ||
    results.blogPosts.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search across the site</DialogDescription>
        </DialogHeader>
        <Command
          label="Global Search"
          shouldFilter={false}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MagnifyingGlassIcon className="text-muted-foreground size-5 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search the site..."
              className="placeholder:text-muted-foreground flex-1 bg-transparent text-base outline-none"
            />
          </div>
          <Command.List className="max-h-100 overflow-y-auto p-2">
            {query.trim().length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Start typing to search.
              </p>
            ) : isPending && !hasAny ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Searching…
              </p>
            ) : !hasAny ? (
              <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
                No results found.
              </Command.Empty>
            ) : null}

            {results.caseStudies.length > 0 && (
              <Command.Group heading="Case Studies" className={groupClass}>
                {results.caseStudies.map((item) => {
                  const href = `/user-stories/${item.slug}`

                  return (
                    <Command.Item
                      key={`case-${item.slug}`}
                      value={`case-${item.slug}`}
                      onSelect={() => navigateAndClose(href)}
                      className={itemClass}
                    >
                      <span className="text-foreground font-medium">
                        {item.title}
                      </span>
                      {item.companyName && (
                        <span className="text-muted-foreground text-xs">
                          {item.companyName}
                        </span>
                      )}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}

            {results.pages.length > 0 && (
              <Command.Group heading="Pages" className={groupClass}>
                {results.pages.map((item) => (
                  <Command.Item
                    key={`page-${item.fullPath}`}
                    value={`page-${item.fullPath}`}
                    onSelect={() => navigateAndClose(item.fullPath)}
                    className={itemClass}
                  >
                    <span className="text-foreground font-medium">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.fullPath}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.blogPosts.length > 0 && (
              <Command.Group heading="Blog Posts" className={groupClass}>
                {results.blogPosts.map((item) => {
                  const href = `/blog/${item.slug}`

                  return (
                    <Command.Item
                      key={`blog-${item.slug}`}
                      value={`blog-${item.slug}`}
                      onSelect={() => navigateAndClose(href)}
                      className={itemClass}
                    >
                      <span className="text-foreground font-medium">
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-muted-foreground line-clamp-1 text-xs">
                          {item.description}
                        </span>
                      )}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
