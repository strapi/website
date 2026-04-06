import type { BoxVariant } from "./Box"

export interface BoxPatternsProps {
  readonly variant: BoxVariant
}

export function BoxPatterns({ variant }: BoxPatternsProps) {
  switch (variant) {
    case "dark":
      return (
        <>
          <div className="gradient-hero-code-overlay absolute inset-y-0 right-0 z-0 h-full w-full opacity-40" />
          <div className="bg-dot-grid absolute inset-y-0 right-0 z-0 h-full w-full" />
        </>
      )

    case "dark-inverse":
      return (
        <>
          <div className="gradient-hero-code-overlay-inverse absolute inset-y-0 right-0 z-0 h-full w-full opacity-40" />
          <div className="bg-dot-grid absolute inset-y-0 right-0 z-0 h-full w-full" />
        </>
      )

    default:
      return null
  }
}
