import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Locale } from "next-intl"

import { Container } from "@/components/elementary/Container"
import { fetchBlogNavigation } from "@/lib/strapi-api/content/server"

import { BlogNavbarTabs } from "./BlogNavbarTabs"
import { Button } from "../ui/button"

export async function BlogNavbar({ locale }: { readonly locale: Locale }) {
  const response = await fetchBlogNavigation(locale)
  const data = response?.data as Record<string, unknown> | undefined

  if (!data) {
    return null
  }

  const categories =
    (data.items as { id: number; name: string; slug: string }[]) ?? []

  return (
    <nav className="border-strapi-neutral-800 border-b px-4 py-3 sm:px-6 sm:py-4">
      <Container>
        <div className="flex items-center justify-between gap-3">
          <BlogNavbarTabs categories={categories} />

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outlineInverse" size="icon">
              <MagnifyingGlassIcon weight="bold" />
            </Button>
            <Button variant="outlineInverse" className="hidden sm:inline-flex">
              Subscribe
            </Button>
          </div>
        </div>
      </Container>
    </nav>
  )
}
