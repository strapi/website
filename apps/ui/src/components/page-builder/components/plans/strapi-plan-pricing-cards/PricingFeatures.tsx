import { CheckIcon } from "@phosphor-icons/react/ssr"
import type { VariantProps } from "class-variance-authority"

import { Tooltip } from "@/components/elementary/Tooltip"
import { type badgeVariants, Badge } from "@/components/ui/badge"
import { cn } from "@/lib/styles"

export interface PricingFeatureProps extends React.ComponentProps<"div"> {
  tooltip?: string | null
  children?: React.ReactNode | null
  badge?: React.ReactNode | null
  badgeStyle?: VariantProps<typeof badgeVariants>["variant"]
}

export function PricingFeature({
  tooltip,
  children,
  badge,
  badgeStyle,
  ...restProps
}: PricingFeatureProps) {
  if (!children) {
    return null
  }

  const output = (
    <div className="inline-flex items-center gap-1" {...restProps}>
      <CheckIcon className="text-strapi-green-500" weight="bold" />
      <span
        data-slot="pricing-feature-label"
        className="text-foreground inline-flex items-center gap-2 text-base"
      >
        <span>{children}</span>
      </span>
      {badge && (
        <Badge size="sm" className="ml-1" variant={badgeStyle}>
          {badge}
        </Badge>
      )}
    </div>
  )

  return (
    <div
      className={cn("flex items-center gap-1", {
        "[&_[data-slot=pricing-feature-label]]:decoration-strapi-purple-400 [&_[data-slot=pricing-feature-label]]:underline [&_[data-slot=pricing-feature-label]]:decoration-dotted [&_[data-slot=pricing-feature-label]]:decoration-2 [&_[data-slot=pricing-feature-label]]:underline-offset-4":
          !!tooltip,
      })}
    >
      {tooltip ? <Tooltip content={tooltip}>{output}</Tooltip> : output}
    </div>
  )
}

export interface PricingFeaturesProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  title?: React.ReactNode
  children: React.ReactNode
}

export function PricingFeatures({
  title,
  children,
  ...restProps
}: PricingFeaturesProps) {
  return (
    <div {...restProps}>
      {title && (
        <h4 className="text-foreground mb-2 text-base font-medium">{title}</h4>
      )}
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}
