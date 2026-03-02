"use client"

import type { Nullable } from "@repo/shared-data"

import { Typography } from "@/components/typography"

import { usePricingBilling } from "./PricingBillingContext"

interface PricingCardPriceProps {
  readonly price?: string | null
  readonly yearlyPrice?: string | null
  readonly priceSubtext?: React.ReactNode
}

function extractNumber(value: string) {
  return value.replaceAll(/^\D+/g, "")
}

function calcYearlyPrices(
  price: Nullable<string>,
  yearlyPrice: Nullable<string>
): {
  totalSavings: string
  yearlyPerMonth: string
  preSavingsYearly: string
} | null {
  if (!price || !yearlyPrice) {
    return null
  }

  const priceNum = Number.parseInt(extractNumber(price))
  const yearlyPriceNum = Number.parseInt(extractNumber(yearlyPrice))

  if (Number.isNaN(priceNum) || Number.isNaN(yearlyPriceNum)) {
    return null
  }

  return {
    yearlyPerMonth: `$${yearlyPriceNum / 12}`,
    totalSavings: `$${12 * priceNum - yearlyPriceNum}`,
    preSavingsYearly: `$${12 * priceNum}`,
  }
}

export function PricingCardPrice({
  price,
  yearlyPrice,
  priceSubtext,
}: PricingCardPriceProps) {
  const { billing } = usePricingBilling()
  const yearly = calcYearlyPrices(price, yearlyPrice)

  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <Typography variant="header3" tag="p">
          {(billing === "yearly" && yearly?.yearlyPerMonth) || price}
        </Typography>
        {priceSubtext && (
          <Typography variant="smallText1" tag="p" textColor="muted">
            {priceSubtext}
          </Typography>
        )}
      </div>
      {billing === "yearly" && (
        <Typography variant="smallText1">
          {yearly?.preSavingsYearly && (
            <>
              <span className="text-strapi-neutral-600 line-through">
                {yearly.preSavingsYearly}
              </span>{" "}
            </>
          )}
          {yearlyPrice} billed yearly
        </Typography>
      )}
    </div>
  )
}
