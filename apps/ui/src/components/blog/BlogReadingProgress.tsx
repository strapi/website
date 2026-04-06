"use client"

import { useEffect, useState } from "react"

import { BLOG_HEADER_OFFSET } from "@/lib/blog-utils"
import { cn } from "@/lib/styles"

const ARTICLE_SELECTOR = "article[data-slot='blog-article']"
const SITE_HEADER_SELECTOR = '[data-slot="site-header"]'

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const article = document.querySelector<HTMLElement>(ARTICLE_SELECTOR)
    const header = document.querySelector<HTMLElement>(SITE_HEADER_SELECTOR)

    if (!article) {
      return
    }

    let start = 0
    let range = 1

    const measure = () => {
      const articleTop = article.getBoundingClientRect().top + window.scrollY
      start = articleTop - BLOG_HEADER_OFFSET
      range = Math.max(
        articleTop + article.offsetHeight - window.innerHeight - start,
        1
      )
    }

    const update = () => {
      setProgress(Math.max(0, Math.min(1, (window.scrollY - start) / range)))
    }

    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    const onResize = () => {
      measure()
      update()
    }

    const articleObserver = new ResizeObserver(onResize)
    articleObserver.observe(article)

    let headerObserver: ResizeObserver | undefined

    if (header) {
      const readHeaderHeight = () => {
        setHeaderHeight(header.getBoundingClientRect().height)
      }

      headerObserver = new ResizeObserver(readHeaderHeight)
      headerObserver.observe(header)
      requestAnimationFrame(readHeaderHeight)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    measure()
    update()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(rafId)
      articleObserver.disconnect()
      headerObserver?.disconnect()
    }
  }, [])

  const visible = progress > 0 && progress < 1

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed right-0 left-0 z-30 h-1",
        "transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ top: headerHeight }}
    >
      <div
        className="bg-strapi-blue-600 h-full origin-left"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
