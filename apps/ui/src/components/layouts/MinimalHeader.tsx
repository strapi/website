import Image from "next/image"

import { Container } from "@/components/elementary/Container"
import { Link } from "@/lib/navigation"

/**
 * Logo-only header used on pages with `minimalLayout` enabled.
 *
 * Matches the same height, padding, container, and logo sizing as the full
 * navbar (`StrapiNavbar`) so toggling between minimal and full layout produces
 * no visual shift in logo position or size.
 *
 * Height: h-16 (mobile) → lg:h-20 (desktop)
 * Logo:   h-6 (mobile) → h-7 (tablet) → xl:h-8 (desktop)
 *
 * @see StrapiNavbar — the full navigation bar this replaces
 * @see StrapiPageView — renders this when `page.minimalLayout` is true
 */
export function MinimalHeader() {
  return (
    <header className="flex h-16 w-full items-center lg:h-20">
      <Container>
        <Link
          href="/"
          className="flex shrink-0 items-center p-0 [&_img]:!h-6 [&_img]:!w-auto sm:[&_img]:!h-7 xl:[&_img]:!h-8"
        >
          <Image
            src="/images/logo/strapi-full-logo-dark.svg"
            alt="Strapi"
            width={140}
            height={32}
            priority
          />
        </Link>
      </Container>
    </header>
  )
}
