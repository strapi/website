"use client"

import type { Data } from "@repo/strapi-types"
import { useMemo, useState } from "react"

type CheckoutModal =
  | Data.Component<"plans.pricing-card-checkout-modal">
  | null
  | undefined

export interface PricingCheckoutDerivedState {
  includedSeats: number
  hasSeatCheckout: boolean
  hasSsoCheckout: boolean
  additionalSeats: number
  additionalSeatItemPriceId: string | null
  selectedPlanItemPriceId: string | null
  selectedSsoItemPriceId: string | null
  planPriceAmount: number | null
  additionalSeatPriceAmount: number | null
  ssoBasePriceAmount: number | null
  ssoSeatPriceAmount: number | null
  ssoDynamicTotal: number | null
  estimatedTotal: number | null
  planPreviewTotal: number
}

interface DeriveCheckoutStateInput {
  checkout: CheckoutModal
  seats: number
  ssoSelected: boolean
}

export type BuildCheckoutUrlReason =
  | "missing_item_price_id"
  | "missing_base_url"
  | "invalid_url"

export type BuildCheckoutUrlResult =
  | {
      ok: true
      url: string
    }
  | {
      ok: false
      reason: BuildCheckoutUrlReason
    }

interface BuildCheckoutUrlInput {
  baseUrl?: string | null
  selectedPlanItemPriceId?: string | null
  selectedSsoItemPriceId?: string | null
  additionalSeatItemPriceId?: string | null
  additionalSeats: number
}

export function parseAmount(value?: string | null) {
  if (!value) {
    return null
  }

  const numericValue = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/)

  if (!numericValue?.[0]) {
    return null
  }

  const parsed = Number.parseFloat(numericValue[0])

  return Number.isNaN(parsed) ? null : parsed
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function deriveCheckoutState({
  checkout,
  seats,
  ssoSelected,
}: DeriveCheckoutStateInput): PricingCheckoutDerivedState {
  const includedSeats = Math.max(1, checkout?.includedSeats ?? 1)
  const additionalSeatItemPriceId =
    checkout?.additionalSeatMonthlyItemPriceId?.trim() || null
  const planItemPriceId = checkout?.planMonthlyItemPriceId?.trim() || null
  const ssoItemPriceId = checkout?.ssoMonthlyItemPriceId?.trim() || null

  const hasSeatCheckout = Boolean(additionalSeatItemPriceId)
  const hasSsoCheckout = Boolean(ssoItemPriceId)
  const additionalSeats = hasSeatCheckout
    ? Math.max(0, seats - includedSeats)
    : 0
  const selectedPlanItemPriceId = planItemPriceId
  const selectedSsoItemPriceId =
    ssoSelected && hasSsoCheckout ? ssoItemPriceId : null

  const planPriceAmount = parseAmount(checkout?.planMonthlyPrice)
  const additionalSeatPriceAmount = parseAmount(
    checkout?.additionalSeatMonthlyPrice
  )
  const ssoBasePriceAmount = parseAmount(checkout?.ssoMonthlyPrice)
  const ssoSeatPriceAmount = parseAmount(checkout?.ssoMonthlyPricePerSeat)

  const shouldFallbackEstimatedTotal =
    planPriceAmount == null ||
    (hasSeatCheckout &&
      additionalSeats > 0 &&
      additionalSeatPriceAmount == null) ||
    (ssoSelected &&
      (ssoBasePriceAmount == null ||
        (additionalSeats > 0 && ssoSeatPriceAmount == null)))

  let estimatedTotal: number | null = null

  if (!shouldFallbackEstimatedTotal && planPriceAmount != null) {
    estimatedTotal = planPriceAmount

    if (
      hasSeatCheckout &&
      additionalSeats > 0 &&
      additionalSeatPriceAmount != null
    ) {
      estimatedTotal += additionalSeats * additionalSeatPriceAmount
    }

    if (ssoSelected) {
      if (ssoBasePriceAmount != null) {
        estimatedTotal += ssoBasePriceAmount
      }

      if (additionalSeats > 0 && ssoSeatPriceAmount != null) {
        estimatedTotal += additionalSeats * ssoSeatPriceAmount
      }
    }
  }

  const planPreviewTotal =
    (planPriceAmount ?? 0) + additionalSeats * (additionalSeatPriceAmount ?? 0)

  const ssoDynamicTotal =
    ssoBasePriceAmount != null &&
    (additionalSeats === 0 || ssoSeatPriceAmount != null)
      ? ssoBasePriceAmount + additionalSeats * (ssoSeatPriceAmount ?? 0)
      : null

  return {
    includedSeats,
    hasSeatCheckout,
    hasSsoCheckout,
    additionalSeats,
    additionalSeatItemPriceId,
    selectedPlanItemPriceId,
    selectedSsoItemPriceId,
    planPriceAmount,
    additionalSeatPriceAmount,
    ssoBasePriceAmount,
    ssoSeatPriceAmount,
    ssoDynamicTotal,
    estimatedTotal,
    planPreviewTotal,
  }
}

export function buildCheckoutUrl({
  additionalSeatItemPriceId,
  additionalSeats,
  baseUrl,
  selectedPlanItemPriceId,
  selectedSsoItemPriceId,
}: BuildCheckoutUrlInput): BuildCheckoutUrlResult {
  if (!selectedPlanItemPriceId?.trim()) {
    return {
      ok: false,
      reason: "missing_item_price_id",
    }
  }

  if (!baseUrl?.trim()) {
    return {
      ok: false,
      reason: "missing_base_url",
    }
  }

  const subscriptionItems: { itemPriceId: string; quantity?: number }[] = [
    {
      itemPriceId: selectedPlanItemPriceId,
    },
  ]

  if (selectedSsoItemPriceId?.trim()) {
    subscriptionItems.push({
      itemPriceId: selectedSsoItemPriceId,
    })
  }

  if (additionalSeatItemPriceId && additionalSeats > 0) {
    subscriptionItems.push({
      itemPriceId: additionalSeatItemPriceId,
      quantity: additionalSeats,
    })
  }

  const params = new URLSearchParams({
    layout: "full_page",
  })

  subscriptionItems.forEach((item, index) => {
    params.set(`subscription_items[item_price_id][${index}]`, item.itemPriceId)

    if (item.quantity != null) {
      params.set(
        `subscription_items[quantity][${index}]`,
        String(item.quantity)
      )
    }
  })

  const checkoutUrl = `${baseUrl.replace(/\/$/, "")}/hosted_pages/checkout?${params.toString()}`

  try {
    new URL(checkoutUrl)
  } catch {
    return {
      ok: false,
      reason: "invalid_url",
    }
  }

  return {
    ok: true,
    url: checkoutUrl,
  }
}

interface UsePricingCheckoutModalStateInput {
  card: Data.Component<"plans.plan-pricing-card-item">
}

export function usePricingCheckoutModalState({
  card,
}: UsePricingCheckoutModalStateInput) {
  const checkout = card.checkoutModal
  const initialIncludedSeats = Math.max(1, checkout?.includedSeats ?? 1)

  const [open, setOpen] = useState(false)
  const [seats, setSeats] = useState(initialIncludedSeats)
  const [ssoSelected, setSsoSelected] = useState(
    Boolean(checkout?.ssoDefaultSelected)
  )

  const checkoutState = useMemo(
    () =>
      deriveCheckoutState({
        checkout,
        seats,
        ssoSelected,
      }),
    [checkout, seats, ssoSelected]
  )

  const resetState = () => {
    setSeats(Math.max(1, checkout?.includedSeats ?? 1))
    setSsoSelected(Boolean(checkout?.ssoDefaultSelected))
  }

  const setOpenWithReset = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState()
    }

    setOpen(nextOpen)
  }

  const setSeatsFromInput = (value: string) => {
    const parsed = Number.parseInt(value, 10)

    if (Number.isNaN(parsed)) {
      setSeats(checkoutState.includedSeats)

      return
    }

    setSeats(Math.max(checkoutState.includedSeats, parsed))
  }

  const decreaseSeats = () => {
    setSeats((current) => Math.max(checkoutState.includedSeats, current - 1))
  }

  const increaseSeats = () => {
    setSeats((current) => current + 1)
  }

  return {
    checkoutState,
    decreaseSeats,
    increaseSeats,
    open,
    seats,
    setOpenWithReset,
    setSeatsFromInput,
    setSsoSelected,
    ssoSelected,
  }
}
