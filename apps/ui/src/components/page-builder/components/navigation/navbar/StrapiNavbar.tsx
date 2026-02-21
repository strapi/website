import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

import { DesktopNavbar } from "./DesktopNavbar"
import { MobileNavbar } from "./MobileNavbar"
import { StrapiLinkImage } from "../../utilities/StrapiLinkImage"

export function StrapiNavbar({
  component,
}: {
  readonly component: Data.Component<"navigation.navbar">
}) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white shadow-lg/8 transition-colors duration-300">
      <Container>
        <div className="relative hidden h-20 w-full items-center gap-3 lg:flex">
          {component.logoImage && (
            <StrapiLinkImage
              component={component.logoImage}
              className="flex shrink-0 items-center p-0"
            />
          )}

          <DesktopNavbar
            navItems={component.navItems}
            ctaLinks={component.ctaLinks}
            bottomLinks={component.bottomLinks}
          />
          <MobileNavbar navItems={component.navItems} />
        </div>
      </Container>
    </nav>
  )
}
