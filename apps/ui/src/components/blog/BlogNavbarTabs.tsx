"use client"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { usePathname } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface Category {
  readonly id: number
  readonly name: string
  readonly slug: string
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

export function BlogNavbarTabs({ categories }: BlogNavbarTabsProps) {
  const pathname = usePathname()

  const isAllActive = pathname === "/blog" || pathname === "/blog/"

  return (
    <div className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto py-1 sm:gap-2">
      <BlogNavbarLink
        href="/blog"
        active={isAllActive}
        className="bg-strapi-blue-600 hover:bg-strapi-blue-600/80 rounded-strapi-sm text-white"
      >
        Blog
      </BlogNavbarLink>

      {categories.map((category) => (
        <BlogNavbarLink
          key={category.id}
          href={`/blog/categories/${category.slug}`}
          active={pathname === `/blog/categories/${category.slug}`}
        >
          {category.name}
        </BlogNavbarLink>
      ))}
    </div>
  )
}
