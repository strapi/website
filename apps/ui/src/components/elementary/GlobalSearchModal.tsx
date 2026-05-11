"use client"

import {
  MagnifyingGlassIcon,
  GlobeIcon,
  FeatherIcon,
  BookOpenIcon,
  AddressBookIcon,
  LightningIcon,
} from "@phosphor-icons/react/ssr"
import { Command } from "cmdk"
import { useLocale } from "next-intl"
import { useEffect, useState, useTransition } from "react"

import {
  Dialog,
  DialogClose,
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

const DEBOUNCE_MS = 350

const EMPTY_RESULT: GlobalSearchResult = {
  caseStudies: [],
  pages: [],
  blogPosts: [],
  features: [],
  docs: [],
}

function docsTitle(item: {
  readonly hierarchy_lvl0?: string | null
  readonly hierarchy_lvl1?: string | null
  readonly hierarchy_lvl2?: string | null
  readonly hierarchy_lvl3?: string | null
}): string {
  return (
    item.hierarchy_lvl3 ||
    item.hierarchy_lvl2 ||
    item.hierarchy_lvl1 ||
    item.hierarchy_lvl0 ||
    "Untitled"
  )
}

function docsBreadcrumb(item: {
  readonly hierarchy_lvl0?: string | null
  readonly hierarchy_lvl1?: string | null
  readonly hierarchy_lvl2?: string | null
}): string {
  return [item.hierarchy_lvl0, item.hierarchy_lvl1, item.hierarchy_lvl2]
    .filter(Boolean)
    .join(" › ")
}

const itemClass = cn(
  "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground min-h-[57px]",
  "flex cursor-pointer items-center gap-0.5 rounded-md gap-3 px-3 py-2 text-sm outline-none border border-accent"
)

const groupClass = cn(
  "[&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mt-4 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
)

export function GlobalSearchModal({
  open,
  onOpenChange,
}: GlobalSearchModalProps) {
  const locale = useLocale()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult>(EMPTY_RESULT)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length === 0) return

    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch({ query: trimmed, locale })

        setResults(res)
        setIsWaiting(false)
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [query, locale])

  function handleQueryChange(next: string) {
    setQuery(next)

    if (next.trim().length === 0) {
      setResults(EMPTY_RESULT)
      setIsWaiting(false)
    } else {
      setIsWaiting(true)
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("")
      setResults(EMPTY_RESULT)
      setIsWaiting(false)
    }

    onOpenChange(next)
  }

  function navigateAndClose(href: string) {
    handleOpenChange(false)
    router.push(href)
  }

  const hasAny =
    results.pages.length > 0 ||
    results.docs.length > 0 ||
    results.blogPosts.length > 0 ||
    results.caseStudies.length > 0 ||
    results.features.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-full max-h-[700px] min-h-[250px] p-0 sm:max-w-[735px]"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search across the site</DialogDescription>
        </DialogHeader>

        <Command
          label="Global Search"
          shouldFilter={false}
          className="flex max-h-full w-full flex-col p-5"
        >
          <div className="flex gap-4">
            <div className="border-strapi-purple-500 rounded-strapi-lg flex flex-1 items-center gap-2 border px-4 py-3">
              <MagnifyingGlassIcon className="text-muted-foreground size-5 min-h-5 min-w-5 shrink-0" />
              <Command.Input
                value={query}
                onValueChange={handleQueryChange}
                placeholder="Search the site..."
                className="placeholder:text-muted-foreground flex-1 text-base outline-none"
              />
            </div>
            <DialogClose asChild>
              <button aria-label="Close search" className="cursor-pointer">
                Cancel
              </button>
            </DialogClose>
          </div>
          <Command.List className="overflow-auto">
            {query.trim().length === 0 ? (
              <div className="mt-6 flex flex-col items-center">
                <MagnifyingGlassIcon className="text-muted-foreground size-9" />
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Start typing to search.
                </p>
              </div>
            ) : (isWaiting || isPending) && !hasAny ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Searching…
              </p>
            ) : !hasAny ? (
              <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
                <div className="flex flex-col items-center">
                  <MagnifyingGlassIcon className="text-muted-foreground size-9" />
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    No results found.
                  </p>
                </div>
              </Command.Empty>
            ) : null}

            {results.pages.length > 0 && (
              <Command.Group heading="Pages" className={groupClass}>
                {results.pages.map((item) => (
                  <Command.Item
                    key={`page-${item.fullPath}`}
                    value={`page-${item.fullPath}`}
                    onSelect={() => navigateAndClose(item.fullPath)}
                    className={itemClass}
                  >
                    <GlobeIcon className="text-muted-foreground size-5 min-h-5 min-w-5" />
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {item.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {`/${item.slug}`}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.docs.length > 0 && (
              <Command.Group heading="Strapi Docs" className={groupClass}>
                {results.docs.map((item) => {
                  const breadcrumb = docsBreadcrumb(item)

                  return (
                    <Command.Item
                      key={`docs-${item.url}`}
                      value={`docs-${item.url}`}
                      onSelect={() => {
                        handleOpenChange(false)
                        window.open(item.url, "_blank", "noopener,noreferrer")
                      }}
                      className={itemClass}
                    >
                      <BookOpenIcon className="text-muted-foreground size-5 min-h-5 min-w-5" />
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {docsTitle(item)}
                        </span>
                        {breadcrumb && (
                          <span className="text-muted-foreground line-clamp-1 text-xs">
                            {breadcrumb}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  )
                })}
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
                      <FeatherIcon className="text-muted-foreground size-5 min-h-5 min-w-5" />
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="text-muted-foreground line-clamp-1 text-xs">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}

            {results.features.length > 0 && (
              <Command.Group heading="Features" className={groupClass}>
                {results.features.map((item) => {
                  const href = item.url ?? ""
                  const isExternal = /^https?:\/\//.test(href)

                  return (
                    <Command.Item
                      key={`feature-${item.title}`}
                      value={`feature-${item.title}`}
                      onSelect={() => {
                        if (!href) return
                        if (isExternal) {
                          handleOpenChange(false)
                          window.open(href, "_blank", "noopener,noreferrer")
                        } else {
                          navigateAndClose(href)
                        }
                      }}
                      className={itemClass}
                    >
                      <LightningIcon className="text-muted-foreground size-5 min-h-5 min-w-5" />
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {item.title}
                        </span>
                        {item.feature_tag && (
                          <span className="text-muted-foreground text-xs">
                            {item.feature_tag}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}

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
                      <AddressBookIcon className="text-muted-foreground size-5 min-h-5 min-w-5" />
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {item.title}
                        </span>
                        {item.companyName && (
                          <span className="text-muted-foreground text-xs">
                            {item.companyName}
                          </span>
                        )}
                      </div>
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
