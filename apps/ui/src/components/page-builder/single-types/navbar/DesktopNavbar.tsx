import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import AppLink from "@/components/elementary/AppLink"
import StrapiImageWithLink from "@/components/page-builder/components/utilities/StrapiImageWithLink"
import StrapiLink, {
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
import { NavMenuSection } from "@/components/page-builder/single-types/navbar/NavMenuSection"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

interface DesktopNavbarProps {
  readonly logoImage:
    | Data.Component<"utilities.image-with-link">
    | undefined
    | null
  readonly navItems: Data.Component<"navbar.nav-item">[] | undefined | null
  readonly ctaLinks: Data.Component<"utilities.link">[] | undefined | null
}

export function DesktopNavbar({
  logoImage,
  navItems,
  ctaLinks,
}: DesktopNavbarProps) {
  return (
    <div className="hidden h-20 w-full items-center gap-3 lg:flex">
      {logoImage && (
        <StrapiImageWithLink
          component={logoImage}
          linkProps={{ className: "flex shrink-0 items-center p-0" }}
          imageProps={{
            hideWhenMissing: true,
          }}
        />
      )}

      {navItems?.length ? (
        <NavigationMenu>
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                {item.sections?.length ? (
                  <DropdownNavItem item={item} />
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
              "text-sm whitespace-nowrap",
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

function DirectNavItem({
  item,
}: {
  readonly item: Data.Component<"navbar.nav-item">
}) {
  const href = getStrapiLinkHref(item.directLink)

  if (!href) {
    return (
      <span
        className={cn(
          navigationMenuTriggerStyle(),
          "text-base",
          "cursor-default"
        )}
      >
        {item.label}
      </span>
    )
  }

  return (
    <AppLink
      href={href}
      variant="ghost"
      className={cn(navigationMenuTriggerStyle(), "text-base")}
    >
      {item.label}
    </AppLink>
  )
}

function DropdownNavItem({
  item,
}: {
  readonly item: Data.Component<"navbar.nav-item">
}) {
  return (
    <>
      <NavigationMenuTrigger className="text-base">
        {item.label}
      </NavigationMenuTrigger>

      <NavigationMenuContent>
        <div className="grid w-[500px] gap-4 p-4 lg:w-[600px] lg:grid-cols-2">
          {item.sections?.map((section) => (
            <NavMenuSection key={section.id} section={section} />
          ))}
        </div>

        {item.bottomLinks?.length ? (
          <div className="bg-muted/50 border-t px-4 py-3">
            <div className="flex items-center gap-4">
              {item.bottomLinks.map((link) => (
                <StrapiLink
                  key={link.id}
                  component={link}
                  className="text-sm font-medium"
                />
              ))}
            </div>
          </div>
        ) : null}
      </NavigationMenuContent>
    </>
  )
}

DesktopNavbar.displayName = "DesktopNavbar"
