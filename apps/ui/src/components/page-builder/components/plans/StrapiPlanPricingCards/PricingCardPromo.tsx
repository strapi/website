import { LightningIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { Typography } from "@/components/typography"
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
      <Typography
        variant="body2"
        className="text-strapi-blue-500 flex items-baseline gap-2"
        fontWeight="medium"
      >
        <span className="relative top-0.75">
          <LightningIcon weight="fill" />
        </span>{" "}
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" fontWeight="medium">
          {subtitle}
        </Typography>
      )}
      {description && (
        <Typography variant="smallText1">{description}</Typography>
      )}
    </div>
  )
}
