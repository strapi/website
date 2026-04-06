import "server-only"

import { cn } from "@/lib/styles"

import { Markdown } from "../elementary/markdown/Markdown"

interface BlogContentProps {
  readonly children?: string | null
  readonly className?: string
}

export function BlogContent({ children, className }: BlogContentProps) {
  if (!children) return null

  return (
    <div data-slot="blog-content" className={cn("wrap-break-word", className)}>
      <Markdown>{children}</Markdown>
    </div>
  )
}
