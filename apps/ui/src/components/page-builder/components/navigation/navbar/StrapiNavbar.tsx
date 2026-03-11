import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { fetchGithubStars } from "@/lib/github"
import { cn } from "@/lib/styles"

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
      className={cn(
        "relative sticky top-0 z-40 flex h-16 w-full items-center",
        "[animation:nav-scroll-detect_steps(1,end)_both]",
        "[animation-range:0px_1px]",
        "[animation-timeline:scroll()]",
        "[--nav-link-hover-initial:var(--color-strapi-blue-600)]",
        "[--nav-link-hover-scrolled:var(--color-strapi-blue-600)]",
        "[--nav-link-hover:var(--nav-link-hover-initial)]",
        "[--nav-logo-default-opacity:1]",
        "[--nav-logo-light-opacity:0]",
        "[--nav-text-initial:inherit]",
        "[--nav-text-scrolled:inherit]",
        "lg:h-20 lg:text-[var(--nav-text-initial)]"
      )}
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
