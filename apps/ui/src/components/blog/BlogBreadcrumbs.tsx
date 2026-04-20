import { CaretRightIcon } from "@phosphor-icons/react/ssr"
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
  readonly current?: string | null
  readonly className?: string
}

export function BlogBreadcrumbs({
  category,
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
        "text-strapi-gray-400 flex flex-wrap items-center gap-1.5 text-sm",
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
          <CaretRightIcon className="size-3.5 opacity-60" aria-hidden />
          <Link
            href={`/blog/categories/${parent.slug}`}
            className="hover:text-strapi-gray-200 transition-colors"
          >
            {parent.name}
          </Link>
        </>
      )}

      {category && (
        <>
          <CaretRightIcon className="size-3.5 opacity-60" aria-hidden />
          <Link
            href={`/blog/categories/${category.slug}`}
            className="hover:text-strapi-gray-200 transition-colors"
          >
            {category.name}
          </Link>
        </>
      )}

      {current && (
        <>
          <CaretRightIcon className="size-3.5 opacity-60" aria-hidden />
          <span className="text-strapi-gray-200 line-clamp-1">{current}</span>
        </>
      )}
    </nav>
  )
}
