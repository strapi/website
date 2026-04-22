import { AuthorAvatars } from "@/components/elementary/AuthorAvatars"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  BLOG_DATE_FORMAT,
  type BlogPost,
  calculateReadTime,
  combineAuthors,
  getBlogPostPublishDate,
  getBlogPostTimelineImage,
  getExcerpt,
} from "@/lib/blog-utils"
import { formatDate } from "@/lib/dates"
import { Link } from "@/lib/navigation"

import { BlogLevelBadge } from "./BlogLevelBadge"

interface FeaturedBlogPostProps {
  readonly post: BlogPost
}

export function FeaturedBlogPost({ post }: FeaturedBlogPostProps) {
  const readTime = calculateReadTime(post.content)
  const excerpt = post.description?.trim() || getExcerpt(post.content)
  const allAuthors = combineAuthors(post.author, post.coauthors ?? undefined)
  const publishDate = getBlogPostPublishDate(post)
  const timelineImage = getBlogPostTimelineImage(post)

  return (
    <HeroContainerBorder asChild>
      <Link
        href={`/blog/${post.slug}`}
        className="group/featured-blog-post-row before:gradient-border-purple relative flex items-center gap-4 transition-[border-color] duration-300 before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300 hover:border-transparent hover:before:opacity-100"
      >
        <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col p-6 sm:p-8 lg:p-14">
            <div className="text-strapi-gray-400 flex flex-wrap items-center gap-3 text-sm font-bold uppercase">
              {post.category?.name && (
                <span className="border-strapi-gray-700/50 rounded-sm border px-3 py-1">
                  {post.category.name}
                </span>
              )}
              <BlogLevelBadge level={post.level} />
              {readTime > 0 && (
                <>
                  {(post.category?.name || post.level) && <span>●</span>}
                  <span>{readTime} min read</span>
                </>
              )}
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover/featured-blog-post-row:decoration-white">
              {post.title}
            </h2>

            {excerpt && (
              <p className="text-strapi-neutral-400 mt-3 text-sm leading-relaxed lg:text-base">
                {excerpt}
              </p>
            )}

            <div className="text-strapi-gray-400 mt-6 flex items-center gap-3 text-sm">
              <AuthorAvatars authors={allAuthors} />

              {publishDate && (
                <>
                  {allAuthors.length > 0 && <span>●</span>}
                  <span>{formatDate(publishDate, BLOG_DATE_FORMAT)}</span>
                </>
              )}
            </div>
          </div>

          {timelineImage && (
            <div className="border-strapi-gray-700/50 relative aspect-square overflow-hidden border-l">
              <StrapiBasicImage
                component={timelineImage}
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
