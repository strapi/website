import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { formatHref, isAppLink, Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

export interface StrapiLinkImageProps {
  readonly component: Data.Component<"utilities.link-image"> | undefined | null
  readonly className?: string
}

export const getStrapiLinkImageHref = (
  component?: Data.Component<"utilities.link-image"> | null
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

export function StrapiLinkImage({
  component,
  className,
}: StrapiLinkImageProps) {
  if (component?.image == null) {
    return null
  }

  const { newTab = false, label } = component ?? {}
  const linkHref = getStrapiLinkImageHref(component)

  if (!linkHref) {
    return null
  }

  const formattedHref = formatHref(linkHref)
  const combinedClassName = cn("relative", className)

  if (isAppLink(formattedHref)) {
    return (
      <Link
        href={formattedHref}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener" : undefined}
        aria-label={label ?? undefined}
        className={combinedClassName}
      >
        <StrapiBasicImage component={component.image} />
      </Link>
    )
  }

  return (
    <a
      href={formattedHref}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={label ?? undefined}
      className={combinedClassName}
    >
      <StrapiBasicImage component={component.image} />
    </a>
  )
}

StrapiLinkImage.displayName = "StrapiLinkImage"

export default StrapiLinkImage
