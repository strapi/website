import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/styles"

export interface ContentCardProps extends ComponentProps<"div"> {
  readonly label?: string | null
  readonly title: string
  readonly children?: ReactNode
}

export function ContentCard({
  label,
  title,
  children,
  className,
  ...props
}: ContentCardProps) {
  return (
    <div className={cn(className)} {...props}>
      <div className="flex flex-col gap-4">
        {label && (
          <p className="text-strapi-purple-600 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            {label}
          </p>
        )}
        <h3 className="text-2xl leading-tight font-semibold tracking-tight">
          {title}
        </h3>
      </div>

      {children && (
        <div className="bg-card rounded-strapi-md mt-8 p-8 shadow drop-shadow-md/5">
          {children}
        </div>
      )}
    </div>
  )
}
