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

interface FeaturedBlogPostProps {
  readonly title: string
  readonly slug: string
  readonly content?: string | null
  readonly publishedAt: string | null
  readonly author?: AuthorAvatarData | null
  readonly coauthors?: readonly AuthorAvatarData[]
  readonly category?: BlogCategory | null
  readonly image?: BlogPostImage | null
}

export function FeaturedBlogPost({
  title,
  slug,
  content,
  publishedAt,
  author,
  coauthors,
  category,
  image,
}: FeaturedBlogPostProps) {
  const readTime = calculateReadTime(content)
  const excerpt = getExcerpt(content)
  const allAuthors = combineAuthors(author, coauthors)

  return (
    <HeroContainerBorder asChild>
      <Link
        href={`/blog/${slug}`}
        className="group/featured-blog-post-row before:gradient-border-purple relative flex items-center gap-4 transition-[border-color] duration-300 before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300 hover:border-transparent hover:before:opacity-100"
      >
        <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col p-6 sm:p-8 lg:p-14">
            <div className="text-strapi-gray-400 flex items-center gap-3 text-sm font-bold uppercase">
              {category?.name && (
                <span className="border-strapi-gray-700/50 rounded-sm border px-3 py-1">
                  {category.name}
                </span>
              )}
              {readTime > 0 && (
                <>
                  {category?.name && <span>●</span>}
                  <span>{readTime} min read</span>
                </>
              )}
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover/featured-blog-post-row:decoration-white">
              {title}
            </h2>

            {excerpt && (
              <p className="text-strapi-neutral-400 mt-3 text-sm leading-relaxed lg:text-base">
                {excerpt}
              </p>
            )}

            <div className="text-strapi-gray-400 mt-6 flex items-center gap-3 text-sm">
              <AuthorAvatars authors={allAuthors} />

              {publishedAt && (
                <>
                  {allAuthors.length > 0 && <span>●</span>}
                  <span>{formatDate(publishedAt, BLOG_DATE_FORMAT)}</span>
                </>
              )}
            </div>
          </div>

          {image?.image && (
            <div className="border-strapi-gray-700/50 relative aspect-square overflow-hidden border-l">
              <StrapiBasicImage
                component={
                  image.image as Parameters<
                    typeof StrapiBasicImage
                  >[0]["component"]
                }
                mode="fill"
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </Link>
    </HeroContainerBorder>
  )
}
