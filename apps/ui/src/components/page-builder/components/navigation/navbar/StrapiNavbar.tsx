import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"

import { DesktopNavbar } from "./DesktopNavbar"
import { MobileNavbar } from "./MobileNavbar"

export function StrapiNavbar({
  component,
}: {
  readonly component: Data.Component<"navigation.navbar">
}) {
  return (
    <nav className="bg-background sticky top-0 z-40 flex h-16 w-full [animation:nav-shadow_linear_both] items-center [animation-range:0px_80px] [animation-timeline:scroll()] lg:h-20">
      <Container>
        <DesktopNavbar
          navItems={component.navItems}
          ctaLinks={component.ctaLinks}
          bottomLinks={component.bottomLinks}
          logoImage={component.logoImage}
        />

        <MobileNavbar
          navItems={component.navItems}
          logoImage={component.logoImage}
          bottomLinks={component.bottomLinks}
        />
      </Container>
    </nav>
  )
}
