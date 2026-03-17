import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

const featureCardTitleVariants = cva("text-foreground font-bold", {
  variants: {
    size: {
      sm: "text-xl",
      default: "text-2xl",
      lg: "text-3xl tracking-tight",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface FeatureCardTitleProps extends VariantProps<
  typeof featureCardTitleVariants
> {
  readonly as?: "h2" | "h3" | "h4" | "h5" | "h6" | "p"
  readonly icon?: React.ReactNode
  readonly iconPosition?: "inline" | "top"
  readonly className?: string
  readonly children?: React.ReactNode
}

export function FeatureCardTitle({
  as = "h3",
  size,
  icon,
  iconPosition = "inline",
  className,
  children,
}: FeatureCardTitleProps) {
  if (!children) {
    return null
  }

  const titleClassName = cn(featureCardTitleVariants({ size }), className)

  if (icon) {
    const Tag = as

    return (
      <div
        data-slot="feature-card-title"
        className={
          iconPosition === "top"
            ? "flex flex-col gap-3"
            : "flex items-center gap-3"
        }
      >
        <div className="shrink-0">{icon}</div>
        <Tag className={titleClassName}>{children}</Tag>
      </div>
    )
  }

  const Tag = as

  return <Tag className={titleClassName}>{children}</Tag>
}
