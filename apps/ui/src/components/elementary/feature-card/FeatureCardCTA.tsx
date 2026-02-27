import type React from "react"

import { cn } from "@/lib/styles"

export interface FeatureCardCTAProps extends React.ComponentProps<"div"> {}

export function FeatureCardCTA({
  className,
  children,
  ...props
}: FeatureCardCTAProps) {
  if (!children) {
    return null
  }

  return (
    <div
      data-slot="feature-card-cta"
      className={cn("flex flex-wrap items-center gap-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}
