import { Slot as SlotPrimitive } from "radix-ui"

import { cn } from "@/lib/styles"

import { Container } from "./Container"

export interface HeroContainerProps extends React.ComponentProps<"div"> {
  readonly affectsNavbarTheme?: boolean
}

export function HeroContainer({
  affectsNavbarTheme = false,
  className,
  children,
  ...restProps
}: HeroContainerProps) {
  return (
    <section
      data-dark-hero={affectsNavbarTheme ? "true" : undefined}
      className="bg-strapi-gray-950 max-lg:bg-dot-grid relative -mt-20 overflow-clip pt-20"
    >
      <Container className="relative z-10 hidden max-w-320 lg:block">
        <div className="absolute -top-40 -left-40 size-[1200px] animate-[hero-glow-drift_12s_linear_2s_forwards]">
          <div className="gradient-hero-glow animate-in fade-in zoom-in-50 fill-mode-both size-full opacity-50 duration-1000 ease-out" />
        </div>
      </Container>
      <div className="border-strapi-gray-700/50 absolute -top-20 h-40 w-full border-b">
        <Container className="h-full max-w-320" variant="hero">
          <div className="border-strapi-gray-700/50 h-full lg:border-r lg:border-l" />
        </Container>
      </div>

      <div className="bg-dot-grid relative h-full w-full">
        <Container className="max-w-320" variant="hero">
          <div
            className={cn(
              "border-strapi-gray-700/50 lg:bg-strapi-gray-950 relative top-0 z-10 flex h-full flex-col gap-4 lg:border-r lg:border-l",
              className
            )}
            {...restProps}
          >
            {children}
          </div>
        </Container>
      </div>
    </section>
  )
}

export function HeroContainerContent({
  className,
  children,
  ...restProps
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("p-6 md:p-4", className)} {...restProps}>
      {children}
    </div>
  )
}

export function HeroContainerBorder({
  asChild = false,
  className,
  children,
  ...restProps
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "div"

  return (
    <Comp
      className={cn("border-strapi-gray-700/50 rounded-2xl border", className)}
      {...restProps}
    >
      {children}
    </Comp>
  )
}
