"use client"

import { XIcon } from "@phosphor-icons/react"
import type { Data } from "@repo/strapi-types"
import { useEffect, useMemo, useRef, useState } from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

const STORAGE_KEY_PREFIX = "strapi_top_banner_dismissed"
const APPEAR_DELAY_MS = 450
const COLLAPSE_UNMOUNT_DELAY_MS = 700

interface StrapiTopBannerProps {
  readonly component: Data.Component<"navigation.top-banner">
}

/**
 * Simple storage helpers scoped to the dismissible Strapi top banner.
 * Handles content hashing, keying, and localStorage persistence.
 */
const storage = {
  /**
   * Compute a simple deterministic hash of the content string.
   * Used as a dismiss key — when content changes, the hash changes
   * and the banner reappears for all users.
   */
  contentHash(str: string): string {
    let hash = 5381

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.codePointAt(i)!) & 0xffffffff
    }

    return Math.abs(hash).toString(36)
  },
  getStorageKey(dismissKey: string): string {
    return `${STORAGE_KEY_PREFIX}:${dismissKey}`
  },
  isDismissed(dismissKey: string): boolean {
    try {
      return window.localStorage.getItem(this.getStorageKey(dismissKey)) === "1"
    } catch {
      return false
    }
  },
  persistDismissed(dismissKey: string): void {
    try {
      window.localStorage.setItem(this.getStorageKey(dismissKey), "1")
    } catch {
      // localStorage might be unavailable in privacy-restricted contexts.
    }
  },
}

export function StrapiTopBanner({ component }: StrapiTopBannerProps) {
  const content = component.content
  const dismissKey = useMemo(
    () => (content ? storage.contentHash(content) : null),
    [content]
  )

  const [shouldRender, setShouldRender] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const hideTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!content || !dismissKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(false)
      setIsOpen(false)

      return
    }

    if (hideTimeoutRef.current != null) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    if (storage.isDismissed(dismissKey)) {
      setShouldRender(false)
      setIsOpen(false)

      return
    }

    setShouldRender(true)

    const appearTimeout = window.setTimeout(() => {
      setIsOpen(true)
    }, APPEAR_DELAY_MS)

    return () => {
      window.clearTimeout(appearTimeout)

      if (hideTimeoutRef.current != null) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [content, dismissKey])

  const handleDismiss = () => {
    if (!dismissKey) {
      return
    }

    storage.persistDismissed(dismissKey)
    setIsOpen(false)

    hideTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false)
      hideTimeoutRef.current = null
    }, COLLAPSE_UNMOUNT_DELAY_MS)
  }

  if (!content || !dismissKey || !shouldRender) {
    return null
  }

  return (
    <div
      className={cn(
        "bg-strapi-purple-600 static z-50 transition-all duration-700 ease-in-out",
        isOpen ? "h-13" : "h-0"
      )}
    >
      <div
        className={cn(
          "relative flex h-13 w-full items-center justify-center pr-12 pl-6 text-center text-sm text-white transition-opacity md:px-12 md:text-base [&_a]:text-amber-200 [&_a]:underline [&_a]:transition-colors [&_a]:hover:text-amber-100",
          isOpen
            ? "opacity-100 delay-300 duration-300"
            : "opacity-0 delay-0 duration-150"
        )}
      >
        <InlineMarkdown className="truncate">{content}</InlineMarkdown>

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer p-1 text-white/80 transition-colors hover:text-white"
          aria-label="Close banner"
        >
          <XIcon className="size-4" weight="bold" />
        </button>
      </div>
    </div>
  )
}
