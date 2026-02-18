import type React from "react"

import { cn } from "@/lib/styles"

export type SectionDescriptionProps = React.HTMLAttributes<HTMLDivElement>

export function SectionDescription({
  children,
  className,
  ...props
}: SectionDescriptionProps) {
  if (children == null) {
    return null
  }

  return (
    <div
      data-slot="section-description"
      className={cn(
        "text-strapi-body-1 text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
