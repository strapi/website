import { WarningIcon } from "@phosphor-icons/react/ssr"
import type { ComponentProps } from "react"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

export interface DisclaimerProps extends ComponentProps<"div"> {
  readonly title: string
  readonly children?: string | null
}

export function Disclaimer({
  title,
  children,
  className,
  ...props
}: DisclaimerProps) {
  return (
    <div
      className={cn(
        "border-strapi-blue-200 bg-strapi-blue-300/50 flex gap-4 rounded-lg border p-6 lg:gap-6 lg:p-8",
        className
      )}
      {...props}
    >
      <WarningIcon className="text-foreground size-8 shrink-0" weight="fill" />

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-base font-semibold lg:text-xl">
          {title}
        </p>

        {children && (
          <div className="text-strapi-neutral-700 text-base lg:text-lg">
            <InlineMarkdown allowNewLines>{children}</InlineMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
