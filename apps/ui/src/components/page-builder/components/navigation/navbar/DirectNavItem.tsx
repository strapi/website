import type { Data } from "@repo/strapi-types"

import { AppLink } from "@/components/elementary/AppLink"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { getStrapiLinkHref } from "../../utilities/StrapiLink"

export interface DirectNavItemProps {
  readonly item: Data.Component<"navbar.nav-item">
  readonly className?: string
}

export function DirectNavItem({ item, className }: DirectNavItemProps) {
  if (!item) {
    return null
  }

  const href = getStrapiLinkHref(item.link)

  if (!href) {
    return (
      <span
        className={cn(
          navigationMenuTriggerStyle(),
          "text-base",
          "cursor-default",
          className
        )}
      >
        {item.link?.label}
      </span>
    )
  }

  return (
    <AppLink
      href={href}
      variant="ghost"
      className={cn(navigationMenuTriggerStyle(), "text-base", className)}
      openInNewTab={item.link?.newTab}
    >
      {item.link?.label}
    </AppLink>
  )
}
