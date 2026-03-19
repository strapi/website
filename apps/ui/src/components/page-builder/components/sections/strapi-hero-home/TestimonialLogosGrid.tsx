"use client"

import type { Data } from "@repo/strapi-types"
import { useEffect, useRef, useState } from "react"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

const MAX_VISIBLE = 6
const SWAP_INTERVAL_MS = 3500
const ANIMATION_DURATION_MS = 400

type Logo = Data.Component<"utilities.basic-image">

interface LogoSlot {
  logo: Logo
  state: "idle" | "exiting" | "entering"
}

interface TestimonialLogosGridProps {
  readonly logos: Logo[]
}

export function TestimonialLogosGrid({ logos }: TestimonialLogosGridProps) {
  const shouldAnimate = logos.length > MAX_VISIBLE
  const [slots, setSlots] = useState<LogoSlot[]>(() =>
    logos.slice(0, MAX_VISIBLE).map((logo) => ({ logo, state: "idle" }))
  )

  // Tracks next slot position to swap (0-5) and next logo index from the full list
  const rotationRef = useRef({ slotIndex: 0, logoIndex: MAX_VISIBLE })

  useEffect(() => {
    if (!shouldAnimate) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      const { slotIndex, logoIndex } = rotationRef.current

      const nextLogo = logos[logoIndex % logos.length]!

      // Exit current logo
      setSlots((prev) =>
        prev.map((slot, i) =>
          i === slotIndex ? { ...slot, state: "exiting" } : slot
        )
      )

      // After fade-out, swap in new logo
      setTimeout(() => {
        setSlots((prev) =>
          prev.map((slot, i) =>
            i === slotIndex ? { logo: nextLogo, state: "entering" } : slot
          )
        )

        // After fade-in, settle to idle
        setTimeout(() => {
          setSlots((prev) =>
            prev.map((slot, i) =>
              i === slotIndex ? { ...slot, state: "idle" } : slot
            )
          )
        }, ANIMATION_DURATION_MS)
      }, ANIMATION_DURATION_MS)

      // Advance rotation counters
      rotationRef.current = {
        slotIndex: (slotIndex + 1) % MAX_VISIBLE,
        logoIndex: logoIndex + 1,
      }
    }, SWAP_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [shouldAnimate, logos])

  return (
    <div
      className={cn(
        "*:border-strapi-gray-700/50 grid flex-1 grid-cols-3 *:border-r *:border-b md:grid-cols-2 lg:grid-cols-3",
        "max-md:[&>*:nth-child(3n)]:border-r-0 max-md:[&>*:nth-last-child(-n+3)]:border-b-0",
        "md:max-md:[&>*:nth-child(2n)]:border-r-0",
        "lg:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-last-child(-n+3)]:border-b-0"
      )}
    >
      {slots.map((slot, index) => (
        <div
          key={`slot-${index}`}
          className="flex items-center justify-center p-5 sm:p-12"
        >
          <div
            className={cn(
              "relative size-[72px] transition-[opacity,filter] duration-400 md:size-[78px]",
              slot.state === "exiting" && "opacity-0 blur-sm",
              slot.state === "entering" && "opacity-0 blur-sm",
              slot.state === "idle" && "blur-0 opacity-100"
            )}
          >
            <StrapiBasicImage
              component={slot.logo}
              transparentPlaceholder
              mode="fill"
              sizes="(max-width: 767px) 72px, 78px"
              className="object-contain"
              decorative
            />
          </div>
        </div>
      ))}
    </div>
  )
}
