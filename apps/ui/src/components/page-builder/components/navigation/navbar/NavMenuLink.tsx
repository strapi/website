import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  StrapiLink,
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

interface NavMenuLinkProps {
  readonly component: Data.Component<"navbar.nav-link"> | undefined | null
  readonly className?: string
}

export function NavMenuLink({ component, className }: NavMenuLinkProps) {
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
        "group/nav-link hover:bg-strapi-blue-100 rounded-strapi-lg flex h-auto flex-col items-start gap-1 whitespace-normal no-underline hover:no-underline md:px-5 md:py-2.5 lg:px-6 lg:py-5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {component.icon && (
          <div className="relative shrink-0">
            <StrapiBasicImage component={component.icon} />
          </div>
        )}

        <p className="strapi-body-1 group-hover/nav-link:text-strapi-blue-500 text-foreground text-sm font-medium md:text-base">
          {component.link?.label}
        </p>
      </div>

      {component.description && (
        <Typography
          variant="smallText2"
          textColor="neutral"
          tag="p"
          className="hidden md:block"
        >
          {component.description}
        </Typography>
      )}
    </StrapiLink>
  )
}
