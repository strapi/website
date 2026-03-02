import type { ComponentProps } from "react"

import { formatHref, isAppLink, Link } from "@/lib/navigation"

interface AppLinkUnstyledProps extends ComponentProps<"a"> {
  readonly href: string
  readonly openInNewTab?: boolean
}

/**
 * Unstyled version of AppLink — resolves internal vs external hrefs automatically.
 * No default styles applied. Use `className` for custom styling.
 *
 * Internal links use next-intl `<Link>`, external links use `<a>`.
 */
export function AppLinkUnstyled({
  href,
  openInNewTab = false,
  children,
  ...props
}: AppLinkUnstyledProps) {
  const formattedHref = formatHref(href)

  const target = openInNewTab ? "_blank" : undefined
  const rel = openInNewTab ? "noopener noreferrer" : undefined

  if (isAppLink(formattedHref)) {
    return (
      <Link href={formattedHref} target={target} rel={rel} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <a href={formattedHref} target={target} rel={rel} {...props}>
      {children}
    </a>
  )
}
