import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

import {
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

import { NavMenuSection } from "./NavMenuSection"
import { StrapiLink } from "../../utilities/StrapiLink"

export interface DropdownNavItemProps {
  readonly bottomLinks: Nullable<Data.Component<"utilities.link">[]>
  readonly item: Data.Component<"navbar.nav-item">
  readonly className?: string
}

export function DropdownNavItem({
  item,
  bottomLinks,
  className,
}: DropdownNavItemProps) {
  if (!item?.link) {
    return null
  }

  return (
    <>
      <NavigationMenuTrigger className={cn("text-base", className)}>
        {item.link?.label}
      </NavigationMenuTrigger>

      <NavigationMenuContent>
        <div className="divide-strapi-neutral-200 flex max-w-[calc(100vw-2rem)] divide-x">
          {item.sections?.map((section) => (
            <NavMenuSection key={section.id} section={section} />
          ))}
        </div>

        {bottomLinks?.length ? (
          <div className="border-strapi-neutral-200 border-t p-4">
            <div className="flex items-center">
              {bottomLinks.map((link) => (
                <StrapiLink
                  key={link.id}
                  component={link}
                  className="text-strapi-neutral-800 hover:text-strapi-blue-600 flex items-center gap-1.5 px-3 py-2 text-sm font-normal"
                  adornmentClassName="size-5"
                />
              ))}
            </div>
          </div>
        ) : null}
      </NavigationMenuContent>
    </>
  )
}
