import type { Locale } from "next-intl"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { fetchNavbar } from "@/lib/strapi-api/content/server"

import { DesktopNavbar } from "./DesktopNavbar"
import { MobileNavbar } from "./MobileNavbar"

export function StrapiNavbar({ locale }: { readonly locale: Locale }) {
  const response = use(fetchNavbar(locale))
  const navbar = response?.data

  if (navbar == null) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-lg/8 transition-colors duration-300">
      <Container>
        <DesktopNavbar
          logoImage={navbar.logoImage}
          navItems={navbar.navItems}
          ctaLinks={navbar.ctaLinks}
          bottomLinks={navbar.bottomLinks}
        />

        <MobileNavbar logoImage={navbar.logoImage} navItems={navbar.navItems} />
      </Container>
    </header>
  )
}
