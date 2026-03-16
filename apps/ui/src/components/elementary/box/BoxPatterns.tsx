import type { BoxVariant } from "./Box"
import { DarkerLeftPattern } from "./patterns/DarkerLeftPattern"
import { DarkerRightPattern } from "./patterns/DarkerRightPattern"
import { GreenBottomLeftPattern } from "./patterns/GreenBottomLeftPattern"
import { GreenTopRightPattern } from "./patterns/GreenTopRightPattern"

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

    case "darker":
      return (
        <>
          <DarkerRightPattern />
          <DarkerLeftPattern />
        </>
      )

    case "green":
      return (
        <>
          <GreenTopRightPattern />
          <GreenBottomLeftPattern />
        </>
      )

    default:
      return null
  }
}
