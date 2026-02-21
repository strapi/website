import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"

interface MobileNavbarProps {
  readonly navItems: Nullable<Data.Component<"navbar.nav-item">[]>
}

export function MobileNavbar({ navItems }: MobileNavbarProps) {
  return <div className="flex h-20 items-center lg:hidden" />
}
