import {
  type AuthorAvatarData,
  AuthorAvatars,
} from "@/components/elementary/AuthorAvatars"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  BLOG_DATE_FORMAT,
  type BlogCategory,
  type BlogPostImage,
  type BlogTag,
  calculateReadTime,
  combineAuthors,
} from "@/lib/blog-utils"
import { formatDate } from "@/lib/dates"
import { Link } from "@/lib/navigation"

interface BlogPostHeaderProps {
  readonly title: string
  readonly publishedAt: string | null
  readonly content?: string | null
  readonly author?: AuthorAvatarData | null
  readonly coauthors?: readonly AuthorAvatarData[]
  readonly category?: BlogCategory | null
  readonly tags?: readonly BlogTag[]
  readonly image?: BlogPostImage | null
}

export function BlogPostHeader({
  title,
  publishedAt,
  content,
  author,
  coauthors,
  category,
  tags,
  image,
}: BlogPostHeaderProps) {
  const readTime = calculateReadTime(content)
  const allAuthors = combineAuthors(author, coauthors)

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-ring-reveal ring-strapi-gray-700/50 overflow-hidden rounded-2xl md:ring">
        <div className="animate-reveal-cascade md:bg-strapi-gray-950 flex flex-col rounded-2xl px-6 py-8 md:px-14 md:py-12">
          <div className="text-strapi-gray-400 flex items-center gap-3 text-sm font-bold tracking-wider uppercase">
            {category?.name && (
              <Link
                href={`/blog/categories/${category.slug}`}
                className="border-strapi-gray-700/50 hover:border-strapi-gray-400/50 rounded-sm border px-3 py-1 transition-colors"
              >
                {category.name}
              </Link>
            )}
            {readTime > 0 && (
              <>
                {category?.name && <span>●</span>}
                <span>{readTime} min read</span>
              </>
            )}
          </div>

          <h1 className="mt-5 text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>

          {tags && tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tags/${tag.slug}`}
                  className="border-strapi-blue-500/40 text-strapi-blue-400 hover:bg-strapi-blue-600/10 hover:border-strapi-blue-400/60 rounded-strapi-sm border px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="border-strapi-gray-700/50 mt-8 flex items-center gap-4 border-t pt-6">
            <AuthorAvatars authors={allAuthors} />

            {publishedAt && (
              <>
                {allAuthors.length > 0 && (
                  <span className="text-strapi-gray-400">●</span>
                )}
                <span className="text-strapi-gray-400 text-sm">
                  {formatDate(publishedAt, BLOG_DATE_FORMAT)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {image?.image && (
        <div className="animate-reveal-cascade animate-ring-reveal ring-strapi-gray-700/50 overflow-hidden rounded-2xl md:ring">
          <StrapiBasicImage
            component={
              image.image as Parameters<typeof StrapiBasicImage>[0]["component"]
            }
            mode="responsive"
            transparentPlaceholder
            className="w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 850px"
          />
        </div>
      )}
    </div>
  )
}
