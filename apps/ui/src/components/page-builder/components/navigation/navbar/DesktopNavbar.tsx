import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

import { GithubStarButton } from "@/components/elementary/GithubStarButton"
import { GlobalSearch } from "@/components/elementary/GlobalSearch"
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
            sizes="140px"
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
            sizes="140px"
            className={cn(
              logoClassName,
              "absolute inset-0 opacity-[var(--nav-logo-light-opacity)]"
            )}
          />
        )}
      </div>

      {navItems?.length ? (
        <NavigationMenu className="static max-w-none flex-initial">
          <NavigationMenuList className="gap-0 xl:gap-3">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                {item.sections?.length ? (
                  <DropdownNavItem
                    className="text-sm xl:text-base"
                    bottomLinks={bottomLinks}
                    item={item}
                  />
                ) : (
                  <DirectNavItem className="text-sm xl:text-base" item={item} />
                )}
              </NavigationMenuItem>
            ))}
            <NavigationMenuIndicator />
          </NavigationMenuList>
        </NavigationMenu>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <GithubStarButton stars={githubStars} className="hidden xl:flex" />
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
