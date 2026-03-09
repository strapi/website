import type React from "react"

import { cn } from "@/lib/styles"

const sizeVariantMap: Record<"sm" | "default" | "lg", string> = {
  sm: "text-xl",
  default: "text-2xl",
  lg: "text-3xl tracking-tight",
}

export interface FeatureCardTitleProps {
  readonly as?: "h2" | "h3" | "h4" | "h5" | "h6" | "p"
  readonly size?: "sm" | "default" | "lg"
  readonly icon?: React.ReactNode
  readonly className?: string
  readonly children?: React.ReactNode
}

export function FeatureCardTitle({
  as = "h3",
  size = "default",
  icon,
  className,
  children,
}: FeatureCardTitleProps) {
  if (!children) {
    return null
  }

  const titleClassName = cn(
    sizeVariantMap[size],
    "text-foreground font-bold",
    className
  )

  if (icon) {
    const Tag = as

    return (
      <div data-slot="feature-card-title" className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <Tag className={titleClassName}>{children}</Tag>
      </div>
    )
  }

  const Tag = as

  return <Tag className={titleClassName}>{children}</Tag>
}
