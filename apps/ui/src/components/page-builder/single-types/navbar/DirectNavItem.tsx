import type { Data } from "@repo/strapi-types"

import { AppLink } from "@/components/elementary/AppLink"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { getStrapiLinkHref } from "../../components/utilities/StrapiLink"

export function DirectNavItem({
  item,
}: {
  readonly item: Data.Component<"navbar.nav-item">
}) {
  const href = getStrapiLinkHref(item.directLink)

  if (!href) {
    return (
      <span
        className={cn(
          navigationMenuTriggerStyle(),
          "text-base",
          "cursor-default"
        )}
      >
        {item.label}
      </span>
    )
  }

  return (
    <AppLink
      href={href}
      variant="ghost"
      className={cn(navigationMenuTriggerStyle(), "text-base")}
    >
      {item.label}
    </AppLink>
  )
}
