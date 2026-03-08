import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

const sizeVariantMap: Record<"sm" | "default" | "lg", string> = {
  sm: "text-sm",
  default: "text-base",
  lg: "text-lg",
}

export interface FeatureCardDescriptionProps {
  readonly size?: "sm" | "default" | "lg"
  readonly className?: string
  readonly children?: React.ReactNode
}

export function FeatureCardDescription({
  size = "default",
  className,
  children,
}: FeatureCardDescriptionProps) {
  if (children == null) {
    return null
  }

  const content =
    typeof children === "string" ? (
      <InlineMarkdown>{children}</InlineMarkdown>
    ) : (
      children
    )

  return (
    <p
      className={cn(sizeVariantMap[size], "text-strapi-neutral-700", className)}
    >
      {content}
    </p>
  )
}
