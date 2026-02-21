import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

interface MobileNavbarProps {
  readonly logoImage: Nullable<Data.Component<"utilities.link-image">>
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
}

export function MobileNavbar({ logoImage, navItems }: MobileNavbarProps) {
  return <div className="flex h-20 items-center lg:hidden" />
}
