"use client"

import { XIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import StrapiLink from "@/components/page-builder/components/utilities/StrapiLink"
import { cn } from "@/lib/styles"

interface NavbarAnnouncementBarProps {
  readonly component:
    | Data.Component<"navbar.announcement-bar">
    | undefined
    | null
}

export function NavbarAnnouncementBar({
  component,
}: NavbarAnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!component || component.isVisible === false || dismissed) {
    return null
  }

  return (
    <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-10 py-2 text-sm text-white">
      {component.badge && (
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
          {component.badge}
        </span>
      )}

      <span className="text-white/90">{component.text}</span>

      {component.link && (
        <StrapiLink
          component={component.link}
          className={cn(
            "inline-flex items-center gap-1 font-medium text-white underline underline-offset-2 hover:text-white/80"
          )}
        />
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 rounded-sm p-0.5 text-white/70 transition-colors hover:text-white"
        aria-label="Dismiss announcement"
      >
        <XIcon className="size-4" weight="bold" />
      </button>
    </div>
  )
}

NavbarAnnouncementBar.displayName = "NavbarAnnouncementBar"
