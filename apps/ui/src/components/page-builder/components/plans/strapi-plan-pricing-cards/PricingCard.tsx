import { useTranslations } from "next-intl"

import { Typography } from "@/components/typography"
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
          "[*]:border-primary rounded-strapi-lg relative border-2 bg-white xl:-my-4 xl:py-11.5":
            highlight,
        },
        className
      )}
      {...restProps}
    >
      {highlight && (
        <div className="bg-primary rounded-strapi-sm absolute -top-4 left-1/2 -translate-x-1/2">
          <Typography
            textColor="white"
            variant="smallText1"
            fontWeight="semiBold"
            className="px-3 py-1"
          >
            {t("bestValue")}
          </Typography>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {label && <Typography variant="label">{label}</Typography>}
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
