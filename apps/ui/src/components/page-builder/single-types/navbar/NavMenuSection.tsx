import type { Data } from "@repo/strapi-types"

import { NavMenuLink } from "@/components/page-builder/single-types/navbar/NavMenuLink"
import { cn } from "@/lib/styles"

interface NavMenuSectionProps {
  readonly section: Data.Component<"navbar.nav-section"> | undefined | null
  readonly compact?: boolean
  readonly className?: string
}

export function NavMenuSection({
  section,
  compact = false,
  className,
}: NavMenuSectionProps) {
  if (!section?.items?.length) return null

  const isGrid = section.layout === "grid"

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {section.title && (
        <span className="text-muted-foreground px-2.5 pb-1 text-xs font-semibold tracking-wider uppercase">
          {section.title}
        </span>
      )}

      <div
        className={cn(
          isGrid ? "grid grid-cols-2 gap-1" : "flex flex-col gap-0.5"
        )}
      >
        {section.items.map((item) => (
          <NavMenuLink
            key={item.id}
            component={item}
            compact={compact || isGrid}
          />
        ))}
      </div>
    </div>
  )
}

NavMenuSection.displayName = "NavMenuSection"
