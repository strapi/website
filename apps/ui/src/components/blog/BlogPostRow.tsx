import {
  type AuthorAvatarData,
  AuthorAvatars,
} from "@/components/elementary/AuthorAvatars"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import { type BlogCategory, combineAuthors } from "@/lib/blog-utils"
import { formatDate } from "@/lib/dates"
import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface BlogPostRowProps {
  readonly title: string
  readonly slug: string
  readonly publishedAt: string | null
  readonly author?: AuthorAvatarData | null
  readonly coauthors?: readonly AuthorAvatarData[]
  readonly category?: BlogCategory | null
  readonly className?: string
}

export function BlogPostRow({
  title,
  slug,
  publishedAt,
  author,
  coauthors,
  category,
  className,
}: BlogPostRowProps) {
  const allAuthors = combineAuthors(author, coauthors)

  return (
    <HeroContainerBorder asChild>
      <div
        className={cn(
          "group/blog-post-row relative grid items-center gap-x-4 gap-y-3 px-5 py-4 transition-[border-color] duration-300 sm:px-8",
          "grid-cols-[auto_auto_auto_1fr] lg:grid-cols-[1fr_7rem_10rem_9rem]",
          "before:gradient-border-purple before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
          "hover:border-transparent hover:before:opacity-100",
          className
        )}
      >
        <Link
          href={`/blog/${slug}`}
          className="col-span-4 truncate pr-4 text-base text-white lg:col-span-1 lg:pr-8 lg:text-lg"
        >
          <span className="underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover/blog-post-row:decoration-white">
            {title}
          </span>
        </Link>

        <div className="flex justify-start lg:col-auto">
          <AuthorAvatars authors={allAuthors} hideUsername />
        </div>

        <div className="flex justify-start">
          {category?.name && category.slug && (
            <Link
              href={`/blog/categories/${category.slug}`}
              className="border-strapi-gray-700/50 text-strapi-gray-400 hover:border-strapi-purple-500 hover:bg-strapi-purple-500 rounded-md border px-3 py-1 text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors hover:text-white sm:text-sm"
            >
              {category.name}
            </Link>
          )}
        </div>

        <span className="text-strapi-gray-400 col-span-4 text-left text-sm whitespace-nowrap sm:col-span-1 sm:text-right lg:text-base">
          {publishedAt ? formatDate(publishedAt, "MMMM D, YYYY") : ""}
        </span>
      </div>
    </HeroContainerBorder>
  )
}
