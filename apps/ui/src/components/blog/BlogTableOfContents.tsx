"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { BLOG_HEADER_OFFSET, type TocHeading } from "@/lib/blog-utils"
import { cn } from "@/lib/styles"

export function BlogTableOfContents({
  headings,
}: {
  readonly headings: TocHeading[]
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const rafRef = useRef(0)
  const activeIdRef = useRef<string | null>(null)

  const h2Headings = useMemo(
    () => headings.filter((h) => h.level === 2),
    [headings]
  )

  useEffect(() => {
    const updateActive = () => {
      let current: string | null = null

      for (const h of h2Headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top <= BLOG_HEADER_OFFSET) {
          current = h.id
        }
      }

      if (current !== activeIdRef.current) {
        activeIdRef.current = current
        setActiveId(current)
      }
    }

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
  }, [h2Headings])

  if (h2Headings.length === 0) {
    return null
  }

  return (
    <nav className="sticky top-28">
      <ul className="flex list-none flex-col gap-2">
        {h2Headings.map((heading) => (
          <li key={heading.id}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(heading.id)
                if (!el) return

                window.scrollTo({
                  behavior: "smooth",
                  top:
                    el.getBoundingClientRect().top +
                    window.scrollY -
                    BLOG_HEADER_OFFSET,
                })
              }}
              className={cn(
                "flex items-center gap-3 text-left text-sm font-medium",
                "transition-[color,translate,padding] duration-300 ease-in-out",
                "text-strapi-gray-700 -translate-x-5 py-1",
                activeId === heading.id &&
                  "text-strapi-blue-600 translate-x-0 py-1",
                "hover:text-strapi-blue-600 hover:translate-x-0"
              )}
            >
              <span className="text-strapi-gray-700/70 h-px w-12 shrink-0 bg-current" />
              <span className="max-w-[200px]">{heading.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
