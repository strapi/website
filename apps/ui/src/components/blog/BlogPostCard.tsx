import {
  type AuthorAvatarData,
  AuthorAvatars,
} from "@/components/elementary/AuthorAvatars"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  BLOG_DATE_FORMAT,
  type BlogCategory,
  type BlogPostImage,
  calculateReadTime,
  combineAuthors,
  getExcerpt,
} from "@/lib/blog-utils"
import { formatDate } from "@/lib/dates"
import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface BlogPostCardProps {
  readonly title: string
  readonly slug: string
  readonly content?: string | null
  readonly publishedAt: string | null
  readonly author?: AuthorAvatarData | null
  readonly coauthors?: readonly AuthorAvatarData[]
  readonly category?: BlogCategory | null
  readonly image?: BlogPostImage | null
  readonly className?: string
}

export function BlogPostCard({
  title,
  slug,
  content,
  publishedAt,
  author,
  coauthors,
  category,
  image,
  className,
}: BlogPostCardProps) {
  const readTime = calculateReadTime(content)
  const excerpt = getExcerpt(content, 120)
  const allAuthors = combineAuthors(author, coauthors)

  return (
    <HeroContainerBorder asChild>
      <Link
        href={`/blog/${slug}`}
        className={cn(
          "group/blog-card relative flex flex-col overflow-hidden bg-white/5 transition-[border-color] duration-300",
          "before:gradient-border-purple before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
          "hover:border-transparent hover:before:opacity-100",
          className
        )}
      >
        {image?.image && (
          <div className="relative aspect-video overflow-hidden">
            <StrapiBasicImage
              component={
                image.image as Parameters<
                  typeof StrapiBasicImage
                >[0]["component"]
              }
              mode="fill"
              className="object-cover transition-transform duration-300 group-hover/blog-card:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-6">
          <div className="text-strapi-gray-400 flex items-center gap-2 text-xs font-bold uppercase">
            {category?.name && (
              <span className="border-strapi-gray-700/50 rounded-sm border px-2 py-0.5">
                {category.name}
              </span>
            )}
            {readTime > 0 && (
              <>
                {category?.name && <span>·</span>}
                <span>{readTime} min read</span>
              </>
            )}
          </div>

          <h3 className="mt-3 text-lg font-bold text-white underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover/blog-card:decoration-white">
            {title}
          </h3>

          {excerpt && (
            <p className="text-strapi-neutral-400 mt-2 line-clamp-2 text-sm leading-relaxed">
              {excerpt}
            </p>
          )}

          <div className="text-strapi-gray-400 mt-auto flex items-center gap-2 pt-4 text-sm">
            <AuthorAvatars authors={allAuthors} hideUsername />

            {publishedAt && (
              <>
                {allAuthors.length > 0 && <span>·</span>}
                <span>{formatDate(publishedAt, BLOG_DATE_FORMAT)}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </HeroContainerBorder>
  )
}
