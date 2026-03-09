"use client"

import type { Data } from "@repo/strapi-types"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  PillGroup,
  PillGroupItem,
  PillGroupLink,
} from "@/components/elementary/PillGroup"
import { cn } from "@/lib/styles"

import { usePricingBilling } from "./PricingBillingContext"
import { getStrapiLinkHref } from "../../utilities/StrapiLink"

export interface PricingSwitcherProps extends React.ComponentProps<"div"> {
  component: Data.Component<"plans.pricing-switcher"> | null | undefined
}

export function PricingSwitcher({
  component,
  className,
  ...restProps
}: PricingSwitcherProps) {
  const t = useTranslations("plans.pricingSwitcher")
  const { billing, setBilling } = usePricingBilling()
  const currentPath = usePathname()
  const showYearlyToggle = component?.showYearlyToggle ?? true

  if (!component) {
    return null
  }

  return (
    <div
      className={cn("flex flex-col items-center gap-6 text-center", className)}
      {...restProps}
    >
      <div className="flex w-full flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        {component.title && (
          <h2 className="text-foreground text-left text-4xl font-bold tracking-tight">
            {component.title}
          </h2>
        )}

        <div className="flex w-auto flex-col-reverse items-start gap-3 md:flex-row md:items-end">
          {showYearlyToggle && (
            <PillGroup>
              <PillGroupItem
                active={billing === "monthly"}
                onClick={() => setBilling("monthly")}
                className="*:text-strapi-blue-500 hover:*:text-strapi-blue-700 inline-flex gap-1"
              >
                {component.monthlyTitle ?? t("monthly")}
                {component.monthlySubtitle && (
                  <>
                    <span>•</span>
                    <span className="text-strapi-blue-600">
                      {component.monthlySubtitle}
                    </span>
                  </>
                )}
              </PillGroupItem>
              <PillGroupItem
                active={billing === "yearly"}
                onClick={() => setBilling("yearly")}
                className="*:text-strapi-blue-500 hover:*:text-strapi-blue-700 inline-flex gap-1"
              >
                {component.yearlyTitle ?? t("yearly")}
                {component.yearlySubtitle && (
                  <>
                    <span>•</span>
                    <span className="text-strapi-blue-600">
                      {component.yearlySubtitle}
                    </span>
                  </>
                )}
              </PillGroupItem>
            </PillGroup>
          )}

          {Array.isArray(component.planTypesSwitcher) &&
            component.planTypesSwitcher.length > 0 && (
              <PillGroup>
                {component.planTypesSwitcher.map((link) => {
                  const linkHref = getStrapiLinkHref(link)

                  if (!linkHref) {
                    return null
                  }

                  return (
                    <PillGroupLink
                      key={link.id}
                      openInNewTab={!!link.newTab}
                      href={linkHref}
                      active={linkHref === "#" || currentPath === linkHref}
                    >
                      {link.label}
                    </PillGroupLink>
                  )
                })}
              </PillGroup>
            )}
        </div>
      </div>
    </div>
  )
}
