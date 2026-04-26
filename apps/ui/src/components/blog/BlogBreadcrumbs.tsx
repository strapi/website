import { useTranslations } from "next-intl"

import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface CategoryRef {
  readonly name: string
  readonly slug: string
}

interface BlogBreadcrumbsProps {
  readonly category?:
    | (CategoryRef & { readonly parent?: CategoryRef | null })
    | null
  readonly tag?: CategoryRef | null
  readonly current?: string | null
  readonly className?: string
}

function BlogBreadcrumbSeparator() {
  return <span className="font-regular opacity-50">/</span>
}

export function BlogBreadcrumbs({
  category,
  tag,
  current,
  className,
}: BlogBreadcrumbsProps) {
  const t = useTranslations("blog.breadcrumbs")

  const parent =
    category?.parent && category.parent.slug !== category.slug
      ? category.parent
      : null

  return (
    <nav
      aria-label={t("ariaLabel")}
      className={cn(
        "text-strapi-gray-400 flex flex-wrap items-center gap-1.5 text-base",
        className
      )}
    >
      <Link
        href="/blog"
        className="hover:text-strapi-gray-200 transition-colors"
      >
        {t("home")}
      </Link>

      {parent && (
        <>
          <BlogBreadcrumbSeparator />
          <Link
            href={`/blog/categories/${parent.slug}`}
            className="hover:text-strapi-blue-400 transition-colors"
          >
            {parent.name}
          </Link>
        </>
      )}

      {category && (
        <>
          <BlogBreadcrumbSeparator />
          <Link
            href={`/blog/categories/${category.slug}`}
            className="text-strapi-blue-500 hover:text-strapi-blue-400 font-medium transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}

      {tag && (
        <>
          <BlogBreadcrumbSeparator />
          <Link
            href={`/blog/tags/${tag.slug}`}
            className="text-strapi-blue-500 hover:text-strapi-blue-400 font-medium transition-colors"
          >
            {tag.name}
          </Link>
        </>
      )}

      {current && (
        <>
          <BlogBreadcrumbSeparator />
          <span className="hover:text-strapi-blue-400 text-strapi-gray-200 line-clamp-1 font-bold transition-colors">
            {current}
          </span>
        </>
      )}
    </nav>
  )
}
