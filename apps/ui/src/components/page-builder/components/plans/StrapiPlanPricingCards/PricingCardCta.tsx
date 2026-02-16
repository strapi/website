import type { Data } from "@repo/strapi-types"

import StrapiLink from "@/components/page-builder/components/utilities/StrapiLink"

import { PricingCheckoutModal } from "./PricingCheckoutModal"

export interface PricingCardCtaProps {
  card: Data.Component<"plans.plan-pricing-card-item">
}

function hasRequiredCheckoutConfig(
  checkoutModal:
    | Data.Component<"plans.pricing-card-checkout-modal">
    | null
    | undefined
) {
  return Boolean(checkoutModal?.planMonthlyItemPriceId?.trim())
}

export function PricingCardCta({ card }: PricingCardCtaProps) {
  if (
    card.ctaMode === "modal" &&
    hasRequiredCheckoutConfig(card.checkoutModal)
  ) {
    return <PricingCheckoutModal card={card} />
  }

  return <StrapiLink component={card.link} />
}

PricingCardCta.displayName = "PricingCardCta"

export default PricingCardCta
