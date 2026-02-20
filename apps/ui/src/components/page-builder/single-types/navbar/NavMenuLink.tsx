import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import StrapiLink, {
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

interface NavMenuLinkProps {
  readonly component: Data.Component<"navbar.nav-link"> | undefined | null
  readonly compact?: boolean
  readonly className?: string
}

export function NavMenuLink({
  component,
  compact = false,
  className,
}: NavMenuLinkProps) {
  if (!component) {
    return null
  }

  const href = getStrapiLinkHref(component.link)

  if (!href) {
    return null
  }

  return (
    <StrapiLink
      component={component.link}
      className={cn(
        "group/nav-link hover:bg-strapi-blue-100 rounded-strapi-lg flex h-auto min-w-0 flex-col items-start gap-1 px-6 py-5 whitespace-normal no-underline transition-colors hover:no-underline",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {component.icon && (
          <div className="relative size-5 shrink-0">
            <StrapiBasicImage component={component.icon} fill />
          </div>
        )}

        <Typography
          variant="body1"
          fontWeight="medium"
          tag="p"
          className="group-hover/nav-link:text-strapi-blue-500"
        >
          {component.link?.label}
        </Typography>
      </div>

      {!compact && component.description && (
        <Typography variant="smallText2" textColor="neutral" tag="p">
          {component.description}
        </Typography>
      )}
    </StrapiLink>
  )
}

NavMenuLink.displayName = "NavMenuLink"
