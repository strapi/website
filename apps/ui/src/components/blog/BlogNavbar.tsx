import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import type { Locale } from "next-intl"

import {
  getBlogNewsletterHubspot,
  type BlogNavbarCategory,
} from "@/lib/blog-utils"
import { fetchBlog } from "@/lib/strapi-api/content/server"

import { BlogNavbarTabs } from "./BlogNavbarTabs"
import { BlogNewsletterPopover } from "./BlogNewsletterPopover"
import { Button } from "../ui/button"

export async function BlogNavbar({ locale }: { readonly locale: Locale }) {
  const response = await fetchBlog(locale)
  const data = response?.data

  if (!data) {
    return null
  }

  const categories: BlogNavbarCategory[] = data.navigation?.items ?? []

  const hubspotForm = getBlogNewsletterHubspot(response)

  return (
    <nav className="border-strapi-neutral-800 px-4 py-3 sm:px-6 sm:py-4 lg:border-b">
      <div className="flex items-center justify-between gap-3">
        <BlogNavbarTabs categories={categories} />

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outlineInverse" size="icon">
            <MagnifyingGlassIcon weight="bold" />
          </Button>
          <BlogNewsletterPopover hubspotForm={hubspotForm} />
        </div>
      </div>
    </nav>
  )
}
