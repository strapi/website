import { cva, type VariantProps } from "class-variance-authority"
import { Slot as SlotPrimitive } from "radix-ui"
import type * as React from "react"

import { cn } from "@/lib/styles"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-strapi-sm border border-transparent font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        muted:
          "bg-strapi-blue-300 text-primary-background [a&]:hover:bg-strapi-blue-300/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 drop-shadow-sm",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-primary text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "underline text-primary underline-offset-4 [a&]:hover:underline",
        purple:
          "bg-strapi-purple-600 text-primary-foreground [a&]:hover:bg-strapi-purple-600/90",
      },
      size: {
        xs: "px-1 py-0.5 text-[0.55rem] leading-none",
        sm: "px-1 py-0.5 text-[0.62em] leading-none",
        default: "px-1.5 py-0.5 text-xs leading-none",
        lg: "px-2 py-0.75 text-sm leading-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
