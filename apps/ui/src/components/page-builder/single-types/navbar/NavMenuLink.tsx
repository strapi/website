import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import StrapiLink, {
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
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
  if (!component) return null

  const href = getStrapiLinkHref(component.link)
  if (!href) return null

  return (
    <StrapiLink
      component={component.link}
      className={cn(
        "group/nav-link hover:bg-accent flex items-start gap-3 rounded-lg p-2.5 no-underline transition-colors",
        className
      )}
    >
      {component.icon && (
        <div className="relative mt-0.5 size-5 shrink-0">
          <StrapiBasicImage component={component.icon} fill />
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <span className="text-sm leading-tight font-medium">
          {component.label}
        </span>

        {!compact && component.description && (
          <span className="text-muted-foreground text-xs leading-snug">
            {component.description}
          </span>
        )}
      </div>
    </StrapiLink>
  )
}

NavMenuLink.displayName = "NavMenuLink"
