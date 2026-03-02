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
    fill: {
      none: "",
      blue: "bg-strapi-blue-600",
      green: "bg-emerald-600",
      dark: "bg-strapi-blue-900",
      purple: "bg-strapi-purple-500",
    },
  },
  defaultVariants: {
    position: "top-left",
    fill: "none",
  },
})

export interface TriangleMaskProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof triangleMaskVariants> {}

export function TriangleMask({
  position = "top-left",
  fill = "none",
  className,
  children,
  ...props
}: TriangleMaskProps) {
  return (
    <div
      data-slot="triangle-mask"
      className={cn(triangleMaskVariants({ position, fill }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
