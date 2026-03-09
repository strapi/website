import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"

import { PricingFeature } from "./PricingFeatures"
import { StrapiLink } from "../../utilities/StrapiLink"

export interface PricingExtraBoxProps {
  data?: Data.Component<"plans.plan-pricing-extra-box"> | null
}

export function PricingExtraBox({ data }: PricingExtraBoxProps) {
  const { title, description, link, features } = data ?? {}

  if (!title) {
    return null
  }

  return (
    <Box
      variant="light"
      className="rounded-strapi-lg mt-15 flex flex-col gap-0 p-8"
      role="complementary"
    >
      <p className="text-foreground text-2xl font-semibold">{title}</p>

      {(description || link || Array.isArray(features)) && (
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col flex-wrap gap-6 md:flex-row">
            {description && (
              <p className="text-foreground w-full text-base font-medium lg:w-auto">
                {description}
              </p>
            )}
            <div className="flex flex-col flex-wrap gap-6 md:flex-row">
              {Array.isArray(features) &&
                features.map((feature) => (
                  <PricingFeature key={feature.id} tooltip={feature.tooltip}>
                    {feature.title}
                  </PricingFeature>
                ))}
            </div>
          </div>
          {link && <StrapiLink component={link} />}
        </div>
      )}
    </Box>
  )
}
