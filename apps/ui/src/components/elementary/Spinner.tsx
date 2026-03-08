import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/styles"

const spinnerVariants = cva("spinner-container", {
  variants: {
    size: {
      xs: "[--spinner-size:12px]",
      sm: "[--spinner-size:24px]",
      default: "[--spinner-size:40px]",
      lg: "[--spinner-size:60px]",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface SpinnerProps
  extends React.ComponentProps<"span">, VariantProps<typeof spinnerVariants> {}

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <span className={cn(spinnerVariants({ size }))} {...props}>
      <span className={cn("spinner text-strapi-blue-500", className)} />
    </span>
  )
}
