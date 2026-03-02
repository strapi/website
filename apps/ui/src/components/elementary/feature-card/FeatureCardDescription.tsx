import type React from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import {
  Typography,
  type Variant as TypographyVariant,
} from "@/components/typography"

const sizeVariantMap: Record<"sm" | "default" | "lg", TypographyVariant> = {
  sm: "smallText1",
  default: "body2",
  lg: "body1",
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
    <Typography
      tag="p"
      variant={sizeVariantMap[size]}
      textColor="neutral"
      className={className}
    >
      {content}
    </Typography>
  )
}
