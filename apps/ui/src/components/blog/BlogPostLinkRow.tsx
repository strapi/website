import { calculateReadTime } from "@/lib/blog-utils"
import { Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

interface BlogPostLinkRowProps {
  readonly post: Record<string, unknown>
  readonly showCategory?: boolean
  readonly className?: string
}

export function BlogPostLinkRow({
  post,
  showCategory = true,
  className,
}: BlogPostLinkRowProps) {
  const category = showCategory
    ? (post.category as { name?: string; slug?: string } | null)
    : null
  const readTime = calculateReadTime(post.content as string | null)

  return (
    <Link
      href={`/blog/${post.slug as string}`}
      className={cn("group flex flex-col gap-1", className)}
    >
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
        {post.title as string}
      </h4>
    </Link>
  )
}
