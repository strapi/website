import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { calculateReadTime, type BlogPost } from "@/lib/blog-utils"
import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface BlogPostLinkRowProps {
  readonly post: BlogPost
  readonly showCategory?: boolean
  readonly showImage?: boolean
  readonly showTags?: boolean
  readonly className?: string
}

export function BlogPostLinkRow({
  post,
  showCategory = true,
  showImage = false,
  showTags = false,
  className,
}: BlogPostLinkRowProps) {
  const category = showCategory ? post.category : null
  const readTime = calculateReadTime(post.content)
  const image = showImage ? post.image : null
  const tags = showTags ? (post.tags ?? []) : []

  const postHref = `/blog/${post.slug}`

  return (
    <div className={cn("group flex items-center gap-4", className)}>
      {image?.image && (
        <Link
          href={postHref}
          className="border-strapi-gray-700/50 relative aspect-video w-24 shrink-0 overflow-hidden rounded-md border sm:w-28"
        >
          <StrapiBasicImage
            component={image.image}
            mode="fill"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 96px, 112px"
          />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={postHref} className="flex min-w-0 flex-col gap-1">
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

          <h4 className="text-base font-semibold text-white underline decoration-white/0 underline-offset-4 transition-[text-decoration-color] duration-300 group-hover:decoration-white">
            {post.title}
          </h4>
        </Link>

        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tags/${tag.slug}`}
                className="border-strapi-gray-700/50 text-strapi-gray-400 hover:border-strapi-gray-500 hover:text-strapi-gray-200 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
