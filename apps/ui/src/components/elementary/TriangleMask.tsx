import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

export const triangleMaskVariants = cva("relative size-full", {
  variants: {
    position: {
      "top-left": "[clip-path:polygon(0_0,100%_0,0_100%)]",
      "top-right": "[clip-path:polygon(0_0,100%_0,100%_100%)]",
      "bottom-right": "[clip-path:polygon(100%_0,100%_100%,0_100%)]",
      "bottom-left": "[clip-path:polygon(0_0,100%_100%,0_100%)]",
    },
  },
  defaultVariants: {
    position: "top-left",
  },
})

export interface TriangleMaskProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof triangleMaskVariants> {}

export function TriangleMask({
  position = "top-left",
  className,
  children,
  ...props
}: TriangleMaskProps) {
  return (
    <div
      data-slot="triangle-mask"
      className={cn(triangleMaskVariants({ position }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
