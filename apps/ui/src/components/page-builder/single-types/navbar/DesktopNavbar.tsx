import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

import StrapiLink from "@/components/page-builder/components/utilities/StrapiLink"
import { StrapiLinkImage } from "@/components/page-builder/components/utilities/StrapiLinkImage"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { DirectNavItem } from "./DirectNavItem"
import { DropdownNavItem } from "./DropdownNavItem"

interface DesktopNavbarProps {
  readonly logoImage: Nullable<Data.Component<"utilities.link-image">>
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
  readonly ctaLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly bottomLinks: Nullable<Data.Component<"utilities.link">[]>
}

export function DesktopNavbar({
  logoImage,
  navItems,
  ctaLinks,
  bottomLinks,
}: DesktopNavbarProps) {
  return (
    <div className="relative flex h-20 w-full items-center gap-3">
      {logoImage && (
        <StrapiLinkImage
          component={logoImage}
          className="flex shrink-0 items-center p-0"
        />
      )}

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
