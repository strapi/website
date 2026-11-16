"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { TocHeading } from "@/lib/blog-utils"
import { cn } from "@/lib/styles"

const SITE_HEADER_SELECTOR = '[data-slot="site-header"]'
/** Clearance under the sticky site header. Matches the old top-28 gap below an 80px navbar. */
const TOC_HEADER_GAP = 32
const TOC_OFFSET_FALLBACK = 112
const OFFSET_CSS_VAR = "--blog-header-offset"

function hashIdFromLocation() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""))
}

function scrollToHeading(id: string, behavior: ScrollBehavior, offset: number) {
  const el = document.getElementById(id)
  if (!el) return

  window.scrollTo({
    behavior,
    top: el.getBoundingClientRect().top + window.scrollY - offset,
  })
}

export function BlogTableOfContents({
  headings,
}: {
  readonly headings: TocHeading[]
}) {
  const t = useTranslations("landmarks")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [offset, setOffset] = useState(TOC_OFFSET_FALLBACK)
  const rafRef = useRef(0)
  const activeIdRef = useRef<string | null>(null)
  const offsetRef = useRef(TOC_OFFSET_FALLBACK)
  const correctedHashRef = useRef(false)

  const h2Headings = useMemo(
    () => headings.filter((h) => h.level === 2),
    [headings]
  )
  const headingIds = useMemo(
    () => new Set(headings.map((heading) => heading.id)),
    [headings]
  )

  const updateActive = useCallback(() => {
    let current: string | null = null
    const threshold = offsetRef.current

    for (const heading of h2Headings) {
      const el = document.getElementById(heading.id)
      if (el && el.getBoundingClientRect().top <= threshold) {
        current = heading.id
      }
    }

    if (current !== activeIdRef.current) {
      activeIdRef.current = current
      setActiveId(current)
    }
  }, [h2Headings])

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(SITE_HEADER_SELECTOR)

    const applyOffset = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const next = headerHeight + TOC_HEADER_GAP
      const changed = offsetRef.current !== next

      offsetRef.current = next
      document.documentElement.style.setProperty(OFFSET_CSS_VAR, `${next}px`)

      if (changed) {
        setOffset(next)
        updateActive()
      }

      if (!correctedHashRef.current) {
        correctedHashRef.current = true
        const id = hashIdFromLocation()
        if (headingIds.has(id)) {
          scrollToHeading(id, "auto", next)
        }
      }
    }

    applyOffset()

    let observer: ResizeObserver | undefined

    if (header) {
      observer = new ResizeObserver(applyOffset)
      observer.observe(header)
    }

    return () => {
      observer?.disconnect()
      document.documentElement.style.removeProperty(OFFSET_CSS_VAR)
    }
  }, [headingIds, updateActive])

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateActive)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    updateActive()

    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [updateActive])

  useEffect(() => {
    const onPopState = () => {
      const id = hashIdFromLocation()
      if (!headingIds.has(id)) return

      requestAnimationFrame(() => {
        scrollToHeading(id, "smooth", offsetRef.current)
      })
    }

    window.addEventListener("popstate", onPopState)

    return () => window.removeEventListener("popstate", onPopState)
  }, [headingIds])

  if (h2Headings.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={t("tableOfContents")}
      className="sticky"
      style={{ top: offset }}
    >
      <ul className="flex list-none flex-col gap-2">
        {h2Headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return
                }

                event.preventDefault()
                scrollToHeading(heading.id, "smooth", offsetRef.current)

                const nextHash = `#${heading.id}`
                if (window.location.hash !== nextHash) {
                  window.history.pushState(null, "", nextHash)
                }
              }}
              className={cn(
                "flex w-full min-w-0 items-center gap-3 text-left text-sm font-medium",
                "transition-[color,translate,padding] duration-300 ease-in-out",
                "text-strapi-gray-700 -translate-x-5 py-1",
                activeId === heading.id &&
                  "text-strapi-blue-600 translate-x-0 py-1",
                "hover:text-strapi-blue-600 hover:translate-x-0"
              )}
            >
              <span className="text-strapi-gray-700/70 h-px w-12 shrink-0 bg-current" />
              <span className="min-w-0 flex-1 wrap-break-word">
                {heading.text}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
