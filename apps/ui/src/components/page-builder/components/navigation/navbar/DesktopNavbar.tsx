import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { DirectNavItem } from "./DirectNavItem"
import { DropdownNavItem } from "./DropdownNavItem"

interface DesktopNavbarProps {
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
  readonly ctaLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly bottomLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly className?: string
}

export function DesktopNavbar({
  navItems,
  ctaLinks,
  bottomLinks,
  className,
}: DesktopNavbarProps) {
  return (
    <div
      className={cn(
        "relative hidden h-20 w-full items-center gap-3 lg:flex",
        className
      )}
    >
      {navItems?.length ? (
        <NavigationMenu className="static max-w-none flex-initial">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                {item.sections?.length ? (
                  <DropdownNavItem bottomLinks={bottomLinks} item={item} />
                ) : (
                  <DirectNavItem item={item} />
                )}
              </NavigationMenuItem>
            ))}
            <NavigationMenuIndicator />
          </NavigationMenuList>
        </NavigationMenu>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Search">
          <MagnifyingGlassIcon className="size-4" weight="bold" />
        </Button>

        {ctaLinks?.map((link, index) => (
          <StrapiLink
            key={link.id ?? index}
            component={link}
            className={cn(
              "whitespace-nowrap",
              !link.decorations && index === 0 && "border-primary border",
              !link.decorations &&
                index > 0 &&
                "bg-primary text-primary-foreground"
            )}
          />
        ))}
      </div>
    </div>
  )
}
