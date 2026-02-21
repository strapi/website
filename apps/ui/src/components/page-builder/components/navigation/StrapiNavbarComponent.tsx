import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { DesktopNavbar } from "@/components/page-builder/single-types/navbar/DesktopNavbar"
import { MobileNavbar } from "@/components/page-builder/single-types/navbar/MobileNavbar"

export default function StrapiNavbarComponent({
  component,
}: {
  readonly component: Data.Component<"navigation.navbar">
}) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white shadow-lg/8 transition-colors duration-300">
      <Container>
        <DesktopNavbar
          logoImage={component.logoImage}
          navItems={component.navItems}
          ctaLinks={component.ctaLinks}
          bottomLinks={component.bottomLinks}
        />
        <MobileNavbar
          logoImage={component.logoImage}
          navItems={component.navItems}
        />
      </Container>
    </nav>
  )
}
