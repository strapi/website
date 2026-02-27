import type React from "react"

import { cn } from "@/lib/styles"

export interface QuoteTriangleProps extends React.ComponentProps<"div"> {}

export function QuoteTriangle({
  className,
  children,
  ...props
}: QuoteTriangleProps) {
  return (
    <div
      data-slot="quote-triangle"
      className={cn("absolute top-0 left-0 aspect-square w-[389px]", className)}
      {...props}
    >
      <div className="relative size-full [clip-path:polygon(100%_0,0_100%,0_0)]">
        <div className="bg-strapi-blue-600 absolute inset-0" />
        {children}
      </div>
    </div>
  )
}
