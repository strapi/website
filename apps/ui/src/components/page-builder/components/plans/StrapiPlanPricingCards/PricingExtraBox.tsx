import type { Data } from "@repo/strapi-types"

import { Typography } from "@/components/typography"

import { PricingFeature } from "./PricingFeatures"
import { StrapiLink } from "../../utilities/StrapiLink"

export interface PricingExtraBox {
  data?: Data.Component<"plans.plan-pricing-extra-box"> | null
}

export function PricingExtraBox({ data }: PricingExtraBox) {
  const { title, description, link, features } = data ?? {}

  if (!title) {
    return null
  }

  return (
    <aside className="rounded-strapi-lg bg-strapi-blue-100 mt-15 flex flex-col gap-0 p-8">
      <Typography tag="p" variant="subtitle1" fontWeight="semiBold">
        {title}
      </Typography>

      {(description || link || Array.isArray(features)) && (
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col flex-wrap gap-6 md:flex-row">
            {description && (
              <Typography
                tag="p"
                variant="body2"
                fontWeight="medium"
                className="w-full lg:w-auto"
              >
                {description}
              </Typography>
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
    </aside>
  )
}
