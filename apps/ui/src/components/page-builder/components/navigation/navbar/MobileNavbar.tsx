"use client"

import { ListIcon, XIcon } from "@phosphor-icons/react/ssr"
import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/styles"

import { DirectNavItem } from "./DirectNavItem"
import { NavMenuLink } from "./NavMenuLink"
import { StrapiLink } from "../../utilities/StrapiLink"
import { StrapiLinkImage } from "../../utilities/StrapiLinkImage"

interface MobileNavbarProps extends React.ComponentProps<"div"> {
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
  readonly logoImage: Nullable<Data.Component<"utilities.link-image">>
  readonly bottomLinks: Nullable<Data.Component<"utilities.link">[]>
}

export function MobileNavbar({
  navItems,
  logoImage,
  className,
  bottomLinks,
  ...restProps
}: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!Array.isArray(navItems) || !navItems.length) {
    return null
  }

  return (
    <div
      className={cn("relative flex justify-between lg:hidden", className)}
      {...restProps}
    >
      {logoImage && (
        <StrapiLinkImage
          component={logoImage}
          className="flex shrink-0 items-center p-0 [&_img]:!h-full [&_img]:!max-h-6 [&_img]:!w-auto"
        />
      )}

      <Button variant="secondary" size="icon" onClick={() => setIsOpen(true)}>
        <ListIcon weight="bold" />
      </Button>

      {isOpen && (
        <>
          {/* Overlay: click to close */}
          <div
            className="animate-in fade-in fixed inset-0 z-40 bg-black/25 duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="bg-background rounded-strapi-lg absolute z-50 flex max-h-[calc(100vh-40px)] w-full origin-top-right animate-[mobile-menu-open_200ms_ease-out] flex-col drop-shadow-2xl">
            <Button
              variant="ghost"
              size="icon-lg"
              className="absolute top-5 right-5 z-1"
              onClick={() => setIsOpen(false)}
            >
              <XIcon weight="bold" className="text-strapi-purple-500 size-6" />
            </Button>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
              {navItems.map((item) => {
                const { sections } = item

                return (
                  <div key={item.id}>
                    <DirectNavItem
                      className="spring-bounce w-full justify-start text-lg font-semibold"
                      item={item}
                    />
                    {Array.isArray(sections) && (
                      <div className="mt-3">
                        {sections
                          .flatMap((item) => item?.items ?? [])
                          .map((item) => (
                            <NavMenuLink key={item.id} component={item} />
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {bottomLinks?.length ? (
              <div className="border-strapi-neutral-200 border-t p-2">
                <div className="flex flex-wrap items-center">
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
          </div>
        </>
      )}
    </div>
  )
}
