import { useTranslations } from "next-intl"

import type { BlogPostLevel } from "@/lib/blog-utils"
import { cn } from "@/lib/styles"

interface BlogLevelBadgeProps {
  readonly level: BlogPostLevel | null | undefined
  readonly className?: string
}

const variantClasses: Record<BlogPostLevel, string> = {
  beginner:
    "border-strapi-green-500/40 text-strapi-green-400 bg-strapi-green-600/10",
  intermediate:
    "border-strapi-blue-500/40 text-strapi-blue-400 bg-strapi-blue-600/10",
  advanced:
    "border-strapi-purple-500/40 text-strapi-purple-400 bg-strapi-purple-600/10",
}

export function BlogLevelBadge({ level, className }: BlogLevelBadgeProps) {
  const t = useTranslations("blog.level")

  if (!level) return null

  return (
    <span
      className={cn(
        "rounded-strapi-sm inline-flex items-center border px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
        variantClasses[level],
        className
      )}
    >
      {t(level)}
    </span>
  )
}
