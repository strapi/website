import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { fetchGithubStars } from "@/lib/github"

import { DesktopNavbar } from "./DesktopNavbar"
import { MobileNavbar } from "./MobileNavbar"

export async function StrapiNavbar({
  component,
}: {
  readonly component: Data.Component<"navigation.navbar">
}) {
  const githubStars = component.githubStars ? await fetchGithubStars() : null

  return (
    <nav
      data-navbar
      className="sticky top-0 z-40 flex h-16 w-full [animation:nav-scroll-shadow_linear_both,nav-scroll-snap_ease-out_both] items-center [--nav-logo-default-opacity:1] [--nav-logo-light-opacity:0] [--nav-text-initial:inherit] [--nav-text-scrolled:inherit] [animation-range:0px_80px,0px_40px] [animation-timeline:scroll(),scroll()] lg:h-20 lg:text-[var(--nav-text-initial)]"
    >
      <Container>
        <DesktopNavbar
          navItems={component.navItems}
          ctaLinks={component.ctaLinks}
          bottomLinks={component.bottomLinks}
          logoImage={component.logoImage}
          logoImageLight={component.logoImageLight}
          githubStars={githubStars}
        />

        <MobileNavbar
          navItems={component.navItems}
          logoImage={component.logoImage}
          logoImageLight={component.logoImageLight}
          bottomLinks={component.bottomLinks}
        />
      </Container>
    </nav>
  )
}
