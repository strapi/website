import { useTranslations } from "next-intl"

import { cn } from "@/lib/styles"

import { PricingCardPrice } from "./PricingCardPrice"

export interface PricingCardProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  highlight?: boolean
  highlightText?: React.ReactNode
  label?: React.ReactNode
  price?: string | null
  yearlyPrice?: string | null
  priceSubtext?: React.ReactNode
  children?: React.ReactNode
}

export function PricingCard({
  label,
  children,
  highlight,
  className,
  price,
  yearlyPrice,
  priceSubtext,
  ...restProps
}: PricingCardProps) {
  const t = useTranslations("general")

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-6 px-6 py-8",
        {
          "[*]:border-primary rounded-strapi-lg relative border-2! bg-white xl:-my-4 xl:py-11.5":
            highlight,
        },
        className
      )}
      {...restProps}
    >
      {highlight && (
        <div className="bg-primary rounded-strapi-sm absolute -top-4 left-1/2 -translate-x-1/2">
          <p className="px-3 py-1 text-sm font-semibold text-white">
            {t("bestValue")}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {label && (
          <p className="text-foreground text-sm font-semibold tracking-[0.5px] uppercase">
            {label}
          </p>
        )}
        <PricingCardPrice
          price={price}
          yearlyPrice={yearlyPrice}
          priceSubtext={priceSubtext}
        />
      </div>

      {children}
    </div>
  )
}
