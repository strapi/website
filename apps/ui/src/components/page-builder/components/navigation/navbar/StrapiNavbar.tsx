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
    <nav className="bg-background sticky top-0 z-40 flex h-16 w-full [animation:nav-shadow_linear_both] items-center [animation-range:0px_80px] [animation-timeline:scroll()] lg:h-20">
      <Container>
        <DesktopNavbar
          navItems={component.navItems}
          ctaLinks={component.ctaLinks}
          bottomLinks={component.bottomLinks}
          logoImage={component.logoImage}
          githubStars={githubStars}
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
