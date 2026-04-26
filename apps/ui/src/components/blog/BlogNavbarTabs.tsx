"use client"

import type { Data } from "@repo/strapi-types"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { usePathname } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface Category {
  readonly id: Data.ID
  readonly name?: string | null
  readonly slug?: string | null
  readonly children?:
    | readonly { id: Data.ID; name?: string | null; slug?: string | null }[]
    | null
}

function BlogNavbarLink({
  href,
  active,
  children,
  className,
}: {
  readonly href: string
  readonly active: boolean
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return (
    <AppLinkUnstyled
      href={href}
      className={cn(
        "px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-base",
        active ? "text-white" : "text-strapi-gray-400 hover:text-white",
        className
      )}
    >
      {children}
    </AppLinkUnstyled>
  )
}

interface BlogNavbarTabsProps {
  readonly categories: readonly Category[]
}

function isCategoryActive(pathname: string, category: Category): boolean {
  if (pathname === `/blog/categories/${category.slug}`) return true

  return (category.children ?? []).some(
    (child) => pathname === `/blog/categories/${child.slug}`
  )
}

export function BlogNavbarTabs({ categories }: BlogNavbarTabsProps) {
  const pathname = usePathname()
  const isAllActive = pathname === "/blog" || pathname === "/blog/"

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto py-1 sm:gap-2">
        <BlogNavbarLink
          href="/blog"
          active={isAllActive}
          className="bg-strapi-blue-600 hover:bg-strapi-blue-600/80 rounded-strapi-sm text-white"
        >
          Blog
        </BlogNavbarLink>

        {categories
          .filter((category) => category.slug && category.name)
          .map((category) => (
            <BlogNavbarLink
              key={category.id}
              href={`/blog/categories/${category.slug}`}
              active={isCategoryActive(pathname, category)}
            >
              {category.name}
            </BlogNavbarLink>
          ))}
      </div>
    </div>
  )
}
