import type { BoxVariant } from "./Box"
import { DarkerLeftPattern } from "./patterns/DarkerLeftPattern"
import { DarkerRightPattern } from "./patterns/DarkerRightPattern"
import { DarkPattern } from "./patterns/DarkPattern"
import { GreenBottomLeftPattern } from "./patterns/GreenBottomLeftPattern"
import { GreenTopRightPattern } from "./patterns/GreenTopRightPattern"

export interface BoxPatternsProps {
  readonly variant: BoxVariant
}

export function BoxPatterns({ variant }: BoxPatternsProps) {
  switch (variant) {
    case "dark":
      return <DarkPattern />

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
