import type { Data } from "@repo/strapi-types"

import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

import { NavMenuLink } from "./NavMenuLink"

interface NavMenuSectionProps {
  readonly section: Data.Component<"navbar.nav-section"> | undefined | null
  readonly className?: string
}

export const NAV_MENU_DEFAULT_COLUMNS = 1

export function NavMenuSection({ section, className }: NavMenuSectionProps) {
  if (!section?.items?.length) {
    return null
  }

  const columns = section.columns ?? NAV_MENU_DEFAULT_COLUMNS

  return (
    <div className={cn("flex flex-col px-8 pt-14 pb-8", className)}>
      {section.title && (
        <Typography variant="label" textColor="muted" className="mb-6 px-6">
          {section.title}
        </Typography>
      )}

      <div
        className="grid items-start gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${columns}, clamp(16rem, 25vw, 20rem))`,
        }}
      >
        {section.items.map((item) => (
          <NavMenuLink key={item.id} component={item} />
        ))}
      </div>
    </div>
  )
}
