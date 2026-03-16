import type React from "react"

import {
  Box,
  boxVariants,
  type BoxVariant,
} from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { cn } from "@/lib/styles"

export type SectionHeaderContainerBackground = Extract<
  BoxVariant,
  "none" | "light" | "dark" | "darker"
>

export interface SectionHeaderContainerProps extends React.ComponentProps<"section"> {
  readonly background?: SectionHeaderContainerBackground
  readonly boxed?: boolean
  readonly containerClassName?: string
  readonly contentClassName?: string
}

export function SectionHeaderContainer({
  children,
  background = "none",
  boxed = false,
  className,
  containerClassName,
  contentClassName,
  ...props
}: SectionHeaderContainerProps) {
  if (children == null) {
    return null
  }

  const hasBackground = background !== "none"
  const boxVariant = hasBackground ? background : "none"

  const content = (
    <div
      className={cn(
        "relative z-10 flex flex-col px-8 py-12 lg:px-14 lg:py-18",
        contentClassName
      )}
    >
      {children}
    </div>
  )

  return (
    <section
      data-slot="section-header-container"
      className={cn(
        !boxed && hasBackground && boxVariants({ variant: background }),
        className
      )}
      {...props}
    >
      {boxed ? (
        <Container className={cn("relative", containerClassName)}>
          <Box
            variant={boxVariant}
            className={cn(hasBackground && "rounded-strapi-lg")}
          >
            {content}
          </Box>
        </Container>
      ) : (
        <Box variant={boxVariant}>
          <Container className={cn("relative", containerClassName)}>
            {content}
          </Container>
        </Box>
      )}
    </section>
  )
}
