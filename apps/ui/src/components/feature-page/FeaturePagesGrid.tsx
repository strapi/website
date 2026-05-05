"use client"

import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  const [isPending, startTransition] = useTransition()

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
          offset: 0,
          limit: pageSize,
        })

        setHits(res.hits)
        setTotal(res.total)
      })
    }, 200)

    return () => clearTimeout(handle)
  }, [query, locale, pageSize, searchAction])

  function loadMore() {
    startTransition(async () => {
      const res = await searchAction({
        locale,
        query,
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((item) => (
            <Card key={item.documentId ?? item.slug}>
              <Link
                href={item.fullPath}
                className="group flex h-full flex-col no-underline"
              >
                <CardContent>
                  <h3 className="text-foreground text-lg font-bold">
                    {item.title}
                  </h3>
                </CardContent>

                <CardFooter>
                  <span className="text-strapi-blue-600 group-hover:text-strapi-blue-700 inline-flex items-center gap-1 text-sm font-medium transition-colors">
                    {t("viewFeature")}
                    <ArrowRightIcon className="size-4" />
                  </span>
                </CardFooter>
              </Link>
            </Card>
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
