"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { NavigationMenu } from "@/components/ui/navigation-menu"

type NavbarNavigationMenuProps = React.ComponentProps<typeof NavigationMenu>

/**
 * Controlled wrapper around the desktop NavigationMenu. The dropdown links
 * navigate client-side, which would otherwise leave Radix's uncontrolled state
 * open over the new page. We track the open item ourselves so we can close it
 * the instant a link is clicked.
 */
export function NavbarNavigationMenu({
  children,
  ...restProps
}: NavbarNavigationMenuProps) {
  const pathname = usePathname()

  const [value, setValue] = useState("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue("")
  }, [pathname])

  /**
   * Close the dropdown the instant a link inside the menu is clicked, instead of
   * waiting for the route transition to finish — otherwise the menu lingers open
   * over the page while navigation/data-fetching resolves.
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a[href]")) {
      setValue("")
    }
  }

  return (
    <NavigationMenu
      value={value}
      onValueChange={setValue}
      onClick={handleClick}
      {...restProps}
    >
      {children}
    </NavigationMenu>
  )
}
