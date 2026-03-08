import { LightningIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { cn } from "@/lib/styles"

export interface PricingCardPromoProps extends React.ComponentProps<"div"> {
  component: Data.Component<"plans.pricing-card-promo"> | undefined | null
}

export function PricingCardPromo({
  component,
  className,
  ...restProps
}: PricingCardPromoProps) {
  if (!component?.title) {
    return null
  }

  const { description, title, subtitle } = component

  return (
    <div
      className={cn(
        "border-strapi-cyan-200 bg-strapi-cyan-100 rounded-strapi-lg flex flex-col gap-2 border p-4",
        className
      )}
      {...restProps}
    >
      <p className="text-strapi-blue-500 flex items-baseline gap-2 text-base font-medium">
        <span className="relative top-0.75">
          <LightningIcon weight="fill" />
        </span>{" "}
        {title}
      </p>
      {subtitle && (
        <p className="text-foreground text-base font-medium">{subtitle}</p>
      )}
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}
