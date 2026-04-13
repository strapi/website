import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Locale } from "next-intl"

import { Container } from "@/components/elementary/Container"
import type { NewsletterFormData } from "@/components/newsletter/NewsletterForm"
import { fetchBlog } from "@/lib/strapi-api/content/server"

import { BlogNavbarTabs } from "./BlogNavbarTabs"
import { BlogNewsletterPopover } from "./BlogNewsletterPopover"
import { Button } from "../ui/button"

export async function BlogNavbar({ locale }: { readonly locale: Locale }) {
  const response = await fetchBlog(locale)
  const data = response?.data as Record<string, unknown> | undefined

  if (!data) {
    return null
  }

  const navigation = data.navigation as Record<string, unknown> | undefined
  const categories =
    (navigation?.items as { id: number; name: string; slug: string }[]) ?? []

  const newsletter = data.newsletter as NewsletterFormData | undefined

  return (
    <nav className="border-strapi-neutral-800 border-b px-4 py-3 sm:px-6 sm:py-4">
      <Container>
        <div className="flex items-center justify-between gap-3">
          <BlogNavbarTabs categories={categories} />

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outlineInverse" size="icon">
              <MagnifyingGlassIcon weight="bold" />
            </Button>
            {newsletter ? (
              <BlogNewsletterPopover newsletter={newsletter} />
            ) : (
              <Button
                variant="outlineInverse"
                className="hidden sm:inline-flex"
              >
                Subscribe
              </Button>
            )}
          </div>
        </div>
      </Container>
    </nav>
  )
}
