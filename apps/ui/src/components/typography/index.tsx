import type React from "react"

import { cn } from "@/lib/styles"

const textColorVariants = {
  foreground: "text-foreground",
  black: "text-black",
  white: "text-white",
  primary: "text-strapi-blue-800",
  neutral: "text-strapi-neutral-700",
  muted: "text-strapi-neutral-600",
}

const fontWeightVariants = {
  black: "font-black",
  extraBold: "font-extrabold",
  bold: "font-bold",
  semiBold: "font-semibold",
  medium: "font-medium",
  normal: "font-normal",
  light: "font-light",
  extraLight: "font-extraLight",
  thin: "font-thin",
}

const variantStyles = {
  header1: "typo-header-1",
  header2: "typo-header-2",
  header3: "typo-header-3",
  subtitle1: "typo-subtitle-1",
  subtitle2: "typo-subtitle-2",
  body1: "typo-body-1",
  body2: "typo-body-2",
  smallText1: "typo-small-1",
  smallText2: "typo-small-2",
  label: "typo-label",
}

const defaultFontWeights: Record<Variant, FontWeight> = {
  header1: "bold",
  header2: "bold",
  header3: "bold",
  subtitle1: "normal",
  subtitle2: "normal",
  body1: "normal",
  body2: "normal",
  smallText1: "normal",
  smallText2: "normal",
  label: "bold",
}

const defaultStyles: Record<TypographyTag, Variant> = {
  h1: "header1",
  h2: "header2",
  h3: "header3",
  h4: "subtitle1",
  h5: "subtitle2",
  h6: "subtitle2",
  p: "body1",
  span: "body2",
  label: "label",
}

type Variant = keyof typeof variantStyles
type TextColor = keyof typeof textColorVariants
type TypographyTag =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label"
type FontWeight = keyof typeof fontWeightVariants

interface TypographyProps {
  children: React.ReactNode
  className?: string
  variant?: Variant
  textColor?: TextColor
  fontWeight?: FontWeight
  uppercase?: boolean
  tag?: TypographyTag
  id?: string
}

export function Typography({
  children,
  className,
  variant,
  textColor = "primary",
  uppercase,
  fontWeight,
  tag: Tag = "p",
  id,
}: TypographyProps) {
  const resolvedVariant = variant ?? defaultStyles[Tag]
  const selectedVariant = variantStyles[resolvedVariant]
  const selectedTextColor = textColorVariants[textColor]
  const resolvedWeight = fontWeight ?? defaultFontWeights[resolvedVariant]
  const selectedFontWeight = fontWeightVariants[resolvedWeight]

  return (
    <Tag
      id={id}
      className={cn(
        selectedVariant,
        selectedTextColor,
        selectedFontWeight,
        uppercase && "uppercase",
        className
      )}
    >
      {children}
    </Tag>
  )
}
