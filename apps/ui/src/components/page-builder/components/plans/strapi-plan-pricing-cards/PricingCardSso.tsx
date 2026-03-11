import type { Data } from "@repo/strapi-types"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/styles"

export interface PricingCardSsoProps extends React.ComponentProps<"div"> {
  component: Data.Component<"plans.pricing-card-sso"> | undefined | null
}

export function PricingCardSso({
  component,
  className,
  ...restProps
}: PricingCardSsoProps) {
  if (!component?.title) {
    return null
  }

  const { description, price, subtext, title } = component

  return (
    <div
      className={cn(
        "pt border-border mt-6 flex flex-col gap-3 border-t pt-6",
        className
      )}
      {...restProps}
    >
      <div className="flex items-center gap-2">
        <p className="text-foreground text-sm font-semibold tracking-[0.5px] uppercase">
          {title}
        </p>
        <Badge className="uppercase" variant="purple" size="sm">
          Add-on
        </Badge>
      </div>
      <div className="flex items-baseline">
        <p className="text-foreground text-2xl font-semibold">{price}</p>
        <p className="text-strapi-neutral-600 text-sm">{subtext}</p>
      </div>
      <p className="text-strapi-neutral-700 text-sm">{description}</p>
    </div>
  )
}
