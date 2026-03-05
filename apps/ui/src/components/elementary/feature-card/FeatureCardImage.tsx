import type React from "react"

import { cn } from "@/lib/styles"

export interface FeatureCardImageProps extends React.ComponentProps<"div"> {}

export function FeatureCardImage({
  className,
  children,
  ...props
}: FeatureCardImageProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="feature-card-image"
      className={cn(
        "rounded-strapi-sm relative aspect-video overflow-hidden [&_img]:size-full [&_img]:object-contain",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
