import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import type React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/styles"

export interface CardGridItemProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  readonly variant?: "story" | "integration"
  readonly topImage?: React.ReactNode
  readonly logo?: React.ReactNode
  readonly title: string
  readonly description?: string
  readonly ctaLabel?: string
  readonly ctaHref?: string
}

export function CardGridItem({
  variant = "integration",
  topImage,
  logo,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
  ...props
}: CardGridItemProps) {
  return (
    <Card
      data-slot="card-grid-item"
      className={cn(
        "group border-border bg-card hover:border-strapi-neutral-300 flex flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-none transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      {variant === "story" && topImage != null && (
        <div className="relative aspect-video w-full overflow-hidden">
          {topImage}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        {logo != null && <div className="flex items-center">{logo}</div>}

        <h3
          className={cn(
            "text-strapi-body-1 text-foreground",
            variant === "story" ? "font-bold" : "font-semibold"
          )}
        >
          {title}
        </h3>

        {variant === "integration" && description != null && (
          <p className="text-strapi-small-1 text-muted-foreground">
            {description}
          </p>
        )}

        {variant === "story" && (
          <div className="mt-auto pt-2">
            <a
              href={ctaHref ?? "#"}
              className="text-strapi-small-1 text-strapi-green-600 hover:text-strapi-green-700 inline-flex items-center gap-1 font-medium transition-colors"
            >
              {ctaLabel ?? "Read a story"}
              <ArrowRightIcon className="size-4" />
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
