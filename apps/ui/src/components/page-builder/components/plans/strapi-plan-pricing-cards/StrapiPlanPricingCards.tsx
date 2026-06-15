import type { Data } from "@repo/strapi-types"
import { cva } from "class-variance-authority"

import { Container } from "@/components/elementary/Container"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { PricingCard } from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/PricingCard"
import {
  PricingFeature,
  PricingFeatures,
} from "@/components/page-builder/components/plans/strapi-plan-pricing-cards/PricingFeatures"

import {
  type PricingBillingPeriod,
  PricingBillingProvider,
} from "./PricingBillingContext"
import { PricingCardCta } from "./PricingCardCta"
import { PricingCardPromo } from "./PricingCardPromo"
import { PricingCardSso } from "./PricingCardSso"
import { PricingExtraBox } from "./PricingExtraBox"
import { PricingSwitcher } from "./PricingSwitcher"

type PlanCardItemType = Data.Component<"plans.plan-pricing-card-item">
type PlanCardItemWithPlan = PlanCardItemType & {
  plan: NonNullable<PlanCardItemType["plan"]> & {
    name: NonNullable<NonNullable<PlanCardItemType["plan"]>["name"]>
  }
}

/**
 * Grid classes adapt columns and merge breakpoint based on card count.
 * - "Separated" = individual card borders + gap (below merge point)
 * - "Merged" = shared container border + dividers (at merge point, all cards in one row)
 */
const pricingGridVariants = cva(
  "border-border *:border-border rounded-strapi-lg mx-auto grid w-full",
  {
    variants: {
      cols: {
        1: "grid-cols-1 gap-6 *:border *:rounded-strapi-lg",
        2: "grid-cols-1 max-sm:gap-6 max-sm:*:border max-sm:*:rounded-strapi-lg sm:grid-cols-2 sm:divide-x sm:divide-border sm:border",
        3: "grid-cols-1 max-lg:gap-6 max-lg:*:border max-lg:*:rounded-strapi-lg md:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-border lg:border",
        4: "grid-cols-1 max-xl:gap-6 max-xl:*:border max-xl:*:rounded-strapi-lg md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:divide-x xl:divide-border xl:border",
      },
    },
    defaultVariants: {
      cols: 1,
    },
  }
)

export function StrapiPlanPricingCards({
  component,
}: {
  component: Data.Component<"plans.plan-pricing-cards">
}) {
  const cards =
    component?.cards?.filter((card): card is PlanCardItemWithPlan =>
      Boolean(card?.plan?.name)
    ) ?? []
  const cols = cards.length
  const initialBilling: PricingBillingPeriod = component.switcher
    ?.isYearlyDefault
    ? "yearly"
    : "monthly"

  return (
    <Container>
      <PricingBillingProvider initialBilling={initialBilling}>
        <PricingSwitcher className="my-16" component={component.switcher} />

        <div
          className={pricingGridVariants({
            cols: (Math.min(cols, 4) as 1 | 2 | 3 | 4) || 1,
          })}
          style={{
            maxWidth: cols > 0 && cols < 3 ? `${cols * 400}px` : undefined,
          }}
        >
          {cards.map((card) => (
            <PricingCard
              key={card.id}
              label={card.plan.name}
              highlight={!!card.highlighted}
              price={card.plan.price}
              yearlyPrice={card.plan.yearlyPrice}
              priceSubtext={card.plan.subtext}
            >
              <PricingCardCta card={card} />

              <PricingFeatures title={card?.starFeaturesTitle}>
                {card?.starFeatures?.map((feature) => (
                  <PricingFeature
                    tooltip={feature.tooltip}
                    key={feature.id}
                    badge={feature.badge}
                    badgeStyle={feature.badgeStyle}
                  >
                    {feature.title}
                  </PricingFeature>
                ))}
              </PricingFeatures>

              <PricingFeatures title={card?.mainFeaturesTitle}>
                {card?.mainFeatures?.map((feature) => (
                  <PricingFeature
                    tooltip={feature.tooltip}
                    key={feature.id}
                    badge={feature.badge}
                    badgeStyle={feature.badgeStyle}
                  >
                    {feature.title}
                  </PricingFeature>
                ))}
              </PricingFeatures>

              <PricingCardPromo component={card.promo} />
              <PricingCardSso component={card.sso} />
            </PricingCard>
          ))}
        </div>
      </PricingBillingProvider>

      <div className="text-strapi-neutral-700 mt-6 text-sm">
        <InlineMarkdown>{component.footnote}</InlineMarkdown>
      </div>

      <PricingExtraBox data={component.extraBox} />
    </Container>
  )
}
