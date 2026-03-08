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
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
}
