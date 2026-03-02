import type React from "react"

import {
  Typography,
  type Variant as TypographyVariant,
} from "@/components/typography"

const sizeVariantMap: Record<"sm" | "default" | "lg", TypographyVariant> = {
  sm: "subtitle2",
  default: "subtitle1",
  lg: "header3",
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

  const variant = sizeVariantMap[size]

  if (icon) {
    return (
      <div data-slot="feature-card-title" className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <Typography
          tag={as}
          variant={variant}
          fontWeight="bold"
          textColor="primary"
          className={className}
        >
          {children}
        </Typography>
      </div>
    )
  }

  return (
    <Typography
      tag={as}
      variant={variant}
      fontWeight="bold"
      textColor="primary"
      className={className}
    >
      {children}
    </Typography>
  )
}
