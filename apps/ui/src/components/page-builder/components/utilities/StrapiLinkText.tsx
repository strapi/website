import type { Data } from "@repo/strapi-types"
import type React from "react"

import { formatHref, isAppLink, Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

export interface StrapiLinkTextProps {
  readonly component: Data.Component<"utilities.link-text"> | undefined | null
  readonly children?: React.ReactNode
  readonly className?: string
  readonly hideWhenMissing?: boolean
}

export const getStrapiLinkTextHref = (
  component?: Data.Component<"utilities.link-text"> | null
) => {
  switch (component?.type) {
    case "external":
      return component.href
    case "page":
      return component.page?.fullPath ?? "#"

    default:
      return
  }
}

export function StrapiLinkText({
  component,
  children,
  className,
  hideWhenMissing,
}: StrapiLinkTextProps) {
  if (component == null && hideWhenMissing) {
    return null
  }

  const { newTab = false, label } = component ?? {}
  const linkHref = getStrapiLinkTextHref(component)

  if (!linkHref) {
    return children ?? label ?? null
  }

  const formattedHref = formatHref(linkHref)
  const combinedClassName = cn(
    "underline-offset-4 transition-[text-decoration]",
    className
  )

  if (isAppLink(formattedHref)) {
    return (
      <Link
        href={formattedHref}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener" : undefined}
        className={combinedClassName}
      >
        {children ?? label}
      </Link>
    )
  }

  return (
    <a
      href={formattedHref}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={combinedClassName}
    >
      {children ?? label}
    </a>
  )
}
