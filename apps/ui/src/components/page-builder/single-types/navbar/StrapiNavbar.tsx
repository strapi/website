import type { Locale } from "next-intl"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { DesktopNavbar } from "@/components/page-builder/single-types/navbar/DesktopNavbar"
import { MobileNavbar } from "@/components/page-builder/single-types/navbar/MobileNavbar"
import { NavbarAnnouncementBar } from "@/components/page-builder/single-types/navbar/NavbarAnnouncementBar"
import { fetchNavbar } from "@/lib/strapi-api/content/server"

export function StrapiNavbar({ locale }: { readonly locale: Locale }) {
  const response = use(fetchNavbar(locale))
  const navbar = response?.data

  if (navbar == null) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-lg/8 transition-colors duration-300">
      <NavbarAnnouncementBar component={navbar.announcementBar} />
      <Container>
        <DesktopNavbar
          logoImage={navbar.logoImage}
          navItems={navbar.navItems}
          ctaLinks={navbar.ctaLinks}
        />

        <MobileNavbar
          logoImage={navbar.logoImage}
          navItems={navbar.navItems}
          ctaLinks={navbar.ctaLinks}
        />
      </Container>
    </header>
  )
}

StrapiNavbar.displayName = "StrapiNavbar"

export default StrapiNavbar
