import type { Data } from "@repo/strapi-types"

import { Typography } from "@/components/typography"
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
        <Typography variant="label">{title}</Typography>
        <Badge className="uppercase" variant="purple" size="sm">
          Add-on
        </Badge>
      </div>
      <div className="flex items-baseline">
        <Typography variant="subtitle1" fontWeight="semiBold">
          {price}
        </Typography>
        <Typography variant="smallText1" textColor="muted">
          {subtext}
        </Typography>
      </div>
      <Typography variant="smallText1" textColor="neutral">
        {description}
      </Typography>
    </div>
  )
}
