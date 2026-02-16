"use client"

import { createContext, useContext, useMemo, useState } from "react"

export type PricingBillingPeriod = "monthly" | "yearly"

interface PricingBillingContextValue {
  readonly billing: PricingBillingPeriod
  readonly setBilling: (billing: PricingBillingPeriod) => void
}

interface PricingBillingProviderProps {
  readonly initialBilling: PricingBillingPeriod
  readonly children: React.ReactNode
}

const PricingBillingContext = createContext<PricingBillingContextValue | null>(
  null
)

export function PricingBillingProvider({
  initialBilling,
  children,
}: PricingBillingProviderProps) {
  const [billing, setBilling] = useState<PricingBillingPeriod>(initialBilling)
  const value = useMemo(() => ({ billing, setBilling }), [billing])

  return (
    <PricingBillingContext.Provider value={value}>
      {children}
    </PricingBillingContext.Provider>
  )
}

export function usePricingBilling() {
  const context = useContext(PricingBillingContext)

  if (!context) {
    throw new Error(
      "usePricingBilling must be used within PricingBillingProvider"
    )
  }

  return context
}
