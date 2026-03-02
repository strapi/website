import type React from "react"

import { TriangleMask } from "@/components/elementary/TriangleMask"
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
      <TriangleMask position="top-left" fill="blue">
        {children}
      </TriangleMask>
    </div>
  )
}
