import { useTranslations } from "next-intl"

import { AuthorAvatars } from "@/components/elementary/AuthorAvatars"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  BLOG_DATE_FORMAT,
  type BlogPost,
  calculateReadTime,
  combineAuthors,
  getBlogPostPublishDate,
  shouldShowUpdatedAt,
} from "@/lib/blog-utils"
import { formatDate } from "@/lib/dates"
import { Link } from "@/lib/navigation"

import { BlogBreadcrumbs } from "./BlogBreadcrumbs"
import { BlogLevelBadge } from "./BlogLevelBadge"

interface BlogPostHeaderProps {
  readonly post: BlogPost
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  const t = useTranslations("blog")
  const readTime = calculateReadTime(post.content)
  const allAuthors = combineAuthors(post.author, post.coauthors ?? undefined)
  const publishDate = getBlogPostPublishDate(post)
  const showUpdated = shouldShowUpdatedAt(publishDate, post.updatedAt)

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-ring-reveal ring-strapi-gray-700/50 overflow-hidden rounded-2xl md:ring">
        <div className="animate-reveal-cascade md:bg-strapi-gray-950 flex flex-col rounded-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-14 md:py-12">
          <BlogBreadcrumbs
            category={
              post.category?.name && post.category?.slug
                ? {
                    name: post.category.name,
                    slug: post.category.slug,
                    parent:
                      post.category.parent?.name && post.category.parent?.slug
                        ? {
                            name: post.category.parent.name,
                            slug: post.category.parent.slug,
                          }
                        : null,
                  }
                : null
            }
            current={post.title}
            className="mb-6"
          />

          <div className="text-strapi-gray-400 flex flex-wrap items-center gap-3 text-sm font-bold tracking-wider uppercase">
            {post.category?.name && (
              <Link
                href={`/blog/categories/${post.category.slug}`}
                className="border-strapi-gray-700/50 hover:border-strapi-gray-400/50 rounded-sm border px-3 py-1 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            <BlogLevelBadge level={post.level} />
            {readTime > 0 && (
              <>
                {(post.category?.name || post.level) && <span>●</span>}
                <span>{readTime} min read</span>
              </>
            )}
          </div>

          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-white sm:mt-5 md:text-4xl">
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="border-strapi-blue-500/40 text-strapi-blue-400 rounded-strapi-sm border px-3 py-1.5 text-sm font-medium"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="border-strapi-gray-700/50 mt-6 flex flex-wrap items-center gap-3 border-t pt-4 sm:mt-8 sm:gap-4 sm:pt-6">
            <AuthorAvatars authors={allAuthors} />

            {publishDate && (
              <>
                {allAuthors.length > 0 && (
                  <span className="text-strapi-gray-400">●</span>
                )}
                <span className="text-strapi-gray-400 text-sm">
                  {formatDate(publishDate, BLOG_DATE_FORMAT)}
                </span>
              </>
            )}

            {showUpdated && post.updatedAt && (
              <>
                <span className="text-strapi-gray-400">●</span>
                <span className="text-strapi-gray-500 text-sm italic">
                  {t("updatedOn", {
                    date: formatDate(post.updatedAt, BLOG_DATE_FORMAT),
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {post.image?.image && (
        <div className="animate-reveal-cascade animate-ring-reveal ring-strapi-gray-700/50 overflow-hidden rounded-2xl md:ring">
          <StrapiBasicImage
            component={post.image.image}
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
