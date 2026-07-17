/**
 * Helpers for the license-key purchase flow (/order-confirmation).
 * Ported from website-2020 `src/services/licenseKeyUtils.js` — the page is
 * driven entirely by query params appended by the checkout (Chargebee) and
 * license-email links.
 *
 * Plan pricing (Chargebee price id and per-seat prices in cents) comes from
 * `GROWTH_PLAN_SSO_PRICE_ID` / `GROWTH_PLAN_SSO_SEAT_PRICE` /
 * `GROWTH_PLAN_SEAT_PRICE` env vars; the helpers throw a descriptive error
 * when one is missing.
 */
import { getEnvVar } from "@/lib/env-vars"

export const optionsDate: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

/** Formats an amount in cents as USD, e.g. 4500 → "$45.00". */
export const formatPrice = (price: string | number) => {
  return (Number(price) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = optionsDate
) => {
  return new Date(dateString).toLocaleDateString("en-US", options)
}

export const nextChargeDate = (dateString: string) => {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)

  return date.toLocaleDateString("en-US", optionsDate)
}

/** Whether the plan price id is the Growth + SSO variant. Throws when
 * `GROWTH_PLAN_SSO_PRICE_ID` is not defined. */
export const isSsoPlan = (planId: string) => {
  return planId === getEnvVar("GROWTH_PLAN_SSO_PRICE_ID", true)
}

/** Derives the seat count from the invoice amount (cents) and plan price id.
 * Throws when the matching seat-price env var is not defined. */
export const getSeats = (amount: string | number, planId: string) => {
  const seatPrice = isSsoPlan(planId)
    ? getEnvVar("GROWTH_PLAN_SSO_SEAT_PRICE", true)
    : getEnvVar("GROWTH_PLAN_SEAT_PRICE", true)

  return Math.ceil(Number(amount) / Number(seatPrice))
}

/**
 * Validates that an email query param is URI-decodable (the old site's
 * `decodeEmail` check). `decodeURIComponent` throws on malformed sequences
 * like "%", so guard it — a crashed confirmation page is worse than the
 * error state.
 */
export const isDecodableEmail = (
  email: string | undefined
): email is string => {
  if (!email) return false

  try {
    return Boolean(decodeURIComponent(email))
  } catch {
    return false
  }
}
