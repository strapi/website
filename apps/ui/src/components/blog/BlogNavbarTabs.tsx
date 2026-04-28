"use client"

import type { Data } from "@repo/strapi-types"
import { useCallback, useEffect, useRef, useState } from "react"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { usePathname } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface Category {
  readonly id: Data.ID
  readonly name?: string | null
  readonly slug?: string | null
  readonly children?:
    | readonly { id: Data.ID; name?: string | null; slug?: string | null }[]
    | null
}

function BlogNavbarLink({
  href,
  active,
  children,
  className,
}: {
  readonly href: string
  readonly active: boolean
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return (
    <AppLinkUnstyled
      href={href}
      className={cn(
        "px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-base",
        active ? "text-white" : "text-strapi-gray-400 hover:text-white",
        className
      )}
    >
      {children}
    </AppLinkUnstyled>
  )
}

interface BlogNavbarTabsProps {
  readonly categories: readonly Category[]
}

function isCategoryActive(pathname: string, category: Category): boolean {
  if (pathname === `/blog/categories/${category.slug}`) return true

  return (category.children ?? []).some(
    (child) => pathname === `/blog/categories/${child.slug}`
  )
}

export function BlogNavbarTabs({ categories }: BlogNavbarTabsProps) {
  const pathname = usePathname()
  const isAllActive = pathname === "/blog" || pathname === "/blog/"
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [scrollState, setScrollState] = useState({
    showLeftFade: false,
    showRightFade: false,
    showDesktopScrollbar: false,
    thumbWidth: 0,
    thumbOffset: 0,
  })

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    const maxScroll = container.scrollWidth - container.clientWidth
    const canScroll = maxScroll > 1
    const showLeftFade = canScroll && container.scrollLeft > 2
    const showRightFade = canScroll && container.scrollLeft < maxScroll - 2

    const thumbWidth = canScroll
      ? Math.max(
          (container.clientWidth * container.clientWidth) /
            container.scrollWidth,
          28
        )
      : 0
    const thumbOffset =
      canScroll && maxScroll > 0
        ? ((container.clientWidth - thumbWidth) * container.scrollLeft) /
          maxScroll
        : 0

    setScrollState({
      showLeftFade,
      showRightFade,
      showDesktopScrollbar: canScroll,
      thumbWidth,
      thumbOffset,
    })
  }, [])

  useEffect(() => {
    updateScrollState()

    const container = scrollContainerRef.current

    if (!container) {
      return
    }

    container.addEventListener("scroll", updateScrollState, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState()
    })

    resizeObserver.observe(container)
    window.addEventListener("resize", updateScrollState)

    return () => {
      container.removeEventListener("scroll", updateScrollState)
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateScrollState)
    }
  }, [updateScrollState])

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="relative">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-black/90 via-black/55 to-transparent transition-opacity sm:hidden",
            scrollState.showLeftFade ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-black/90 via-black/55 to-transparent transition-opacity sm:hidden",
            scrollState.showRightFade ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto py-1 sm:gap-2"
        >
          <BlogNavbarLink
            href="/blog"
            active={isAllActive}
            className="bg-strapi-blue-600 hover:bg-strapi-blue-600/80 rounded-strapi-sm text-white"
          >
            Blog
          </BlogNavbarLink>

          {categories
            .filter((category) => category.slug && category.name)
            .map((category) => (
              <BlogNavbarLink
                key={category.id}
                href={`/blog/categories/${category.slug}`}
                active={isCategoryActive(pathname, category)}
              >
                {category.name}
              </BlogNavbarLink>
            ))}
        </div>

        {scrollState.showDesktopScrollbar && (
          <>
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 hidden h-[3px] rounded-full bg-white/20 sm:block" />
            <div
              className="pointer-events-none absolute bottom-0 hidden h-[3px] rounded-full bg-white/55 sm:block"
              style={{
                width: `${scrollState.thumbWidth}px`,
                transform: `translateX(${scrollState.thumbOffset}px)`,
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
