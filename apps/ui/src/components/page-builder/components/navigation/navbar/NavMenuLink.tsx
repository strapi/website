import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  StrapiLink,
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
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
          <div className="relative size-4 shrink-0">
            <StrapiBasicImage component={component.icon} mode="fill" />
          </div>
        )}

        <p className="group-hover/nav-link:text-strapi-blue-500 text-foreground text-base font-medium">
          {component.link?.label}
        </p>
      </div>

      {component.description && (
        <p className="text-strapi-neutral-700 hidden text-xs md:block">
          {component.description}
        </p>
      )}
    </StrapiLink>
  )
}
