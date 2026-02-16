import { CheckIcon } from "@phosphor-icons/react/ssr"
import type { VariantProps } from "class-variance-authority"

import { Tooltip } from "@/components/elementary/Tooltip"
import { Typography } from "@/components/typography"
import { type badgeVariants, Badge } from "@/components/ui/badge"
import { cn } from "@/lib/styles"

export interface PricingFeatureProps extends React.ComponentProps<"div"> {
  tooltip?: React.ReactNode | null
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
      <Typography variant="body2" className="inline-flex items-center gap-2">
        <span>{children}</span>
      </Typography>
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
        "[&_p]:decoration-strapi-purple-400 [&_p]:underline [&_p]:decoration-dotted [&_p]:decoration-2 [&_p]:underline-offset-4":
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
        <Typography
          variant="body2"
          fontWeight="medium"
          tag="h4"
          className="mb-2"
        >
          {title}
        </Typography>
      )}
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}
