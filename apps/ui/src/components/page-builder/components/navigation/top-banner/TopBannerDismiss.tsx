"use client"

import { XIcon } from "@phosphor-icons/react"

interface TopBannerDismissProps {
  readonly storageKey: string
}

/**
 * Dismiss control for the top banner. On click it persists the dismissal in
 * localStorage and flips the `data-top-banner-dismissed` flag on <html> — the
 * same flag the pre-paint no-flash script sets — so CSS collapses the banner
 * immediately (and on every subsequent page load, before first paint).
 */
export function TopBannerDismiss({ storageKey }: TopBannerDismissProps) {
  const handleDismiss = () => {
    try {
      window.localStorage.setItem(storageKey, "1")
    } catch {
      // localStorage might be unavailable in privacy-restricted contexts.
    }

    document.documentElement.dataset.topBannerDismissed = "1"
  }

  return (
    <button
      type="button"
      onClick={handleDismiss}
      className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer p-1 text-white/80 transition-colors hover:text-white"
      aria-label="Close banner"
    >
      <XIcon className="size-4" weight="bold" />
    </button>
  )
}
