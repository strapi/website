import { cva, type VariantProps } from "class-variance-authority"
import type React from "react"

import { cn } from "@/lib/styles"

const typographyVariants = cva("", {
  variants: {
    variant: {
      header1: "text-5xl tracking-tight",
      header2: "text-4xl tracking-tight",
      header3: "text-3xl tracking-tight",
      subtitle1: "text-2xl",
      subtitle2: "text-xl",
      body1: "text-lg",
      body2: "text-base",
      smallText1: "text-sm",
      smallText2: "text-xs",
      label: "text-sm tracking-[0.5px] uppercase",
    },
    textColor: {
      foreground: "text-foreground",
      black: "text-black",
      white: "text-white",
      primary: "text-foreground",
      neutral: "text-strapi-neutral-700",
      muted: "text-strapi-neutral-600",
    },
    fontWeight: {
      black: "font-black",
      extraBold: "font-extrabold",
      bold: "font-bold",
      semiBold: "font-semibold",
      medium: "font-medium",
      normal: "font-normal",
      light: "font-light",
      extraLight: "font-extraLight",
      thin: "font-thin",
    },
    uppercase: {
      true: "uppercase",
    },
  },
  defaultVariants: {
    textColor: "foreground",
  },
})

export type Variant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>
type FontWeight = NonNullable<
  VariantProps<typeof typographyVariants>["fontWeight"]
>

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
  label: "semiBold",
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

interface TypographyProps extends Omit<
  VariantProps<typeof typographyVariants>,
  "variant"
> {
  children: React.ReactNode
  className?: string
  variant?: Variant
  tag?: TypographyTag
  id?: string
}

export function Typography({
  children,
  className,
  variant,
  textColor,
  uppercase,
  fontWeight,
  tag: Tag = "p",
  id,
}: TypographyProps) {
  const resolvedVariant = variant ?? defaultStyles[Tag]
  const resolvedWeight = fontWeight ?? defaultFontWeights[resolvedVariant]

  return (
    <Tag
      id={id}
      className={cn(
        typographyVariants({
          variant: resolvedVariant,
          textColor,
          fontWeight: resolvedWeight,
          uppercase,
        }),
        className
      )}
    >
      {children}
    </Tag>
  )
}
