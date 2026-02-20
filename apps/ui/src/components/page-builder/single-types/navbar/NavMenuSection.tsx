import type { Data } from "@repo/strapi-types"

import { NavMenuLink } from "@/components/page-builder/single-types/navbar/NavMenuLink"
import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

interface NavMenuSectionProps {
  readonly section: Data.Component<"navbar.nav-section"> | undefined | null
  readonly compact?: boolean
  readonly className?: string
}

export const NAV_MENU_DEFAULT_COLUMNS = 1

export function NavMenuSection({
  section,
  compact = false,
  className,
}: NavMenuSectionProps) {
  if (!section?.items?.length) {
    return null
  }

  const columns = section.columns ?? NAV_MENU_DEFAULT_COLUMNS

  return (
    <div
      className={cn("flex min-w-0 flex-1 flex-col px-8 pt-14 pb-8", className)}
    >
      {section.title && (
        <Typography variant="label" textColor="muted" className="mb-6 px-6">
          {section.title}
        </Typography>
      )}

      <div
        className={cn("grid items-center gap-2.5", {
          "grid-cols-1": columns === 1,
          "grid-cols-2": columns === 2,
          "grid-cols-3": columns === 3,
          "grid-cols-4": columns === 4,
          "grid-cols-5": columns === 5,
        })}
      >
        {section.items.map((item) => (
          <NavMenuLink key={item.id} component={item} compact={compact} />
        ))}
      </div>
    </div>
  )
}
