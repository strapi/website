import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

import { GithubStarButton } from "@/components/elementary/GithubStarButton"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { DirectNavItem } from "./DirectNavItem"
import { DropdownNavItem } from "./DropdownNavItem"
import { StrapiLinkImage } from "../../utilities/StrapiLinkImage"

interface DesktopNavbarProps extends React.ComponentProps<"div"> {
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
  readonly ctaLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly bottomLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly logoImage: Nullable<Data.Component<"utilities.link-image">>
  readonly logoImageLight: Nullable<Data.Component<"utilities.link-image">>
  readonly githubStars: number | null
  readonly className?: string
}

const logoClassName =
  "flex shrink-0 items-center p-0 [&_img]:!h-7 [&_img]:!w-auto xl:[&_img]:!h-8"

export function DesktopNavbar({
  navItems,
  ctaLinks,
  bottomLinks,
  logoImage,
  logoImageLight,
  githubStars,
  className,
  ...restProps
}: DesktopNavbarProps) {
  return (
    <div
      className={cn("hidden items-center gap-3 lg:flex", className)}
      {...restProps}
    >
      <div className="relative shrink-0">
        {logoImage && (
          <StrapiLinkImage
            component={logoImage}
            imageMode="responsive"
            transparentPlaceholder
            className={cn(
              logoClassName,
              "opacity-[var(--nav-logo-default-opacity)]"
            )}
          />
        )}
        {logoImageLight && (
          <StrapiLinkImage
            component={logoImageLight}
            imageMode="responsive"
            transparentPlaceholder
            className={cn(
              logoClassName,
              "absolute inset-0 opacity-[var(--nav-logo-light-opacity)]"
            )}
          />
        )}
      </div>

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
        <GithubStarButton stars={githubStars} />
        {ctaLinks?.map((link, index) => (
          <StrapiLink
            key={link.id ?? index}
            component={link}
            className={cn(
              "whitespace-nowrap lg:h-[38px] lg:px-[18px] lg:text-sm xl:h-[42px] xl:px-6 xl:text-base",
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
