"use client"

import { CaretDownIcon } from "@phosphor-icons/react/ssr"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { AppLink } from "@/components/elementary/AppLink"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { cn } from "@/lib/styles"

export interface NavLinkTriggerProps {
  readonly href: string
  readonly label: string
  readonly openInNewTab?: boolean
  readonly className?: string
}

export function NavLinkTrigger({
  href,
  label,
  openInNewTab,
  className,
}: NavLinkTriggerProps) {
  return (
    <NavigationMenuPrimitive.Trigger
      asChild
      data-slot="navigation-menu-trigger"
    >
      <AppLink
        href={href}
        variant="ghost"
        openInNewTab={openInNewTab}
        className={cn(navigationMenuTriggerStyle(), "text-base", className)}
      >
        {label}{" "}
        <CaretDownIcon
          className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
          weight="bold"
          aria-hidden="true"
        />
      </AppLink>
    </NavigationMenuPrimitive.Trigger>
  )
}
