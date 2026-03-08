"use client"

import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { PricingCardSso } from "./PricingCardSso"
import { PricingFeature, PricingFeatures } from "./PricingFeatures"
import {
  buildCheckoutUrl,
  formatUsd,
  usePricingCheckoutModalState,
} from "./usePricingCheckoutModalState"

export interface PricingCheckoutModalProps {
  card: Data.Component<"plans.plan-pricing-card-item">
}

export function PricingCheckoutModal({ card }: PricingCheckoutModalProps) {
  const t = useTranslations("plans.pricingCheckoutModal")
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const {
    checkoutState,
    decreaseSeats,
    increaseSeats,
    open,
    seats,
    setOpenWithReset,
    setSeatsFromInput,
    setSsoSelected,
    ssoSelected,
  } = usePricingCheckoutModalState({ card })

  const handleContinue = () => {
    setError(null)

    const checkoutUrlResult = buildCheckoutUrl({
      baseUrl: process.env.NEXT_PUBLIC_CHARGEBEE_URL,
      selectedPlanItemPriceId: checkoutState.selectedPlanItemPriceId,
      selectedSsoItemPriceId: checkoutState.selectedSsoItemPriceId,
      additionalSeatItemPriceId: checkoutState.additionalSeatItemPriceId,
      additionalSeats: checkoutState.additionalSeats,
    })

    if (!checkoutUrlResult.ok) {
      console.error(
        checkoutUrlResult.reason === "missing_item_price_id"
          ? t("checkoutConfigMissingError")
          : checkoutUrlResult.reason === "missing_base_url"
            ? t("checkoutBaseUrlMissingError")
            : t("checkoutUrlInvalidError")
      )
      setError(t("checkoutError"))

      return
    }

    setIsNavigating(true)
    window.location.assign(checkoutUrlResult.url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpenWithReset}>
      <DialogTrigger asChild>
        <Button
          variant={card.link?.decorations?.variant ?? "default"}
          size={card.link?.decorations?.size ?? "default"}
        >
          {card.link?.label ?? t("buyNow")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="mb-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <p className="text-foreground text-sm font-semibold tracking-[0.5px] uppercase">
                {card.plan?.name}
              </p>
              <p className="text-strapi-neutral-700 text-sm uppercase">
                {t("selfHosted")}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-baseline">
                <p className="text-foreground text-3xl font-semibold tracking-tight">
                  {checkoutState.planPreviewTotal != null
                    ? formatUsd(checkoutState.planPreviewTotal)
                    : null}
                </p>
                <p className="text-strapi-neutral-700 text-base">
                  {t("billingPeriodMonthly")}
                </p>
              </div>
              {checkoutState.hasSeatCheckout && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-border"
                      onClick={decreaseSeats}
                      disabled={seats <= checkoutState.includedSeats}
                      aria-label={t("decreaseSeatCountAria")}
                    >
                      -
                    </Button>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={seats}
                        min={checkoutState.includedSeats}
                        onChange={(event) =>
                          setSeatsFromInput(event.target.value)
                        }
                        className="relative z-2 w-24"
                        aria-label={t("seatCountLabel")}
                      />
                      <span
                        className="text-strapi-neutral-600 absolute top-1.5 right-2 z-1 text-base select-none"
                        aria-hidden="true"
                      >
                        {t("seats")}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-border"
                      onClick={increaseSeats}
                      aria-label={t("increaseSeatCountAria")}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {Array.isArray(card.starFeatures) && card.starFeatures.length > 0 && (
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
          )}

          {checkoutState.hasSsoCheckout && (
            <div className="border-border flex flex-row items-center gap-6 border-t pt-6">
              <PricingCardSso
                component={card.sso}
                className="mt-0 border-none pt-0"
              />
              <Switch
                checked={ssoSelected}
                size="lg"
                variant="success"
                onCheckedChange={(checked) => setSsoSelected(Boolean(checked))}
                aria-label={card.sso?.title ?? t("ssoToggle")}
              />
            </div>
          )}

          <div className="border-border flex flex-col items-baseline justify-between gap-2 border-t pt-6 sm:flex-row">
            <p className="text-foreground text-lg">{t("totalBeforeTaxes")}</p>
            {checkoutState.estimatedTotal != null ? (
              <p className="text-foreground text-xl font-semibold">
                {formatUsd(checkoutState.estimatedTotal)}
                <span className="text-strapi-neutral-700 ml-1 text-sm">
                  {t("billingPeriodMonthly")}
                </span>
              </p>
            ) : (
              <p className="text-strapi-neutral-600 text-sm">
                {t("totalShownAtCheckout")}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="mt-6">
          <div className="flex w-full justify-between">
            <DialogClose asChild>
              <Button variant="secondary">{t("cancel")}</Button>
            </DialogClose>
            <Button onClick={handleContinue} disabled={isNavigating}>
              {isNavigating ? t("redirecting") : t("continue")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
