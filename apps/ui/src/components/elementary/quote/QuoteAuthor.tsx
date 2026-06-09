import type React from "react"

import { cn } from "@/lib/styles"

export interface QuoteAuthorProps extends Omit<
  React.ComponentProps<"div">,
  "role"
> {
  readonly name: React.ReactNode
  readonly role?: string | null
  readonly avatar?: React.ReactNode
  readonly logo?: React.ReactNode
}

export function QuoteAuthor({
  name,
  role,
  avatar,
  logo,
  className,
  ...props
}: QuoteAuthorProps) {
  return (
    <div
      data-slot="quote-author"
      className={cn("flex items-start gap-5", className)}
      {...props}
    >
      {avatar && (
        <div className="bg-strapi-neutral-400 relative size-16 shrink-0 overflow-hidden rounded-full">
          {avatar}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-foreground text-base">
          <strong className="text-strapi-blue-600 font-bold">{name}</strong>
          {role && <span className="text-foreground">, {role}</span>}
        </span>

        {logo}
      </div>
    </div>
  )
}
