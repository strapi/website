"use client"

import type { Data } from "@repo/strapi-types"
import { useEffect, useRef, useState } from "react"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

const MAX_VISIBLE = 6
const SWAP_INTERVAL_MS = 3500
const ANIMATION_DURATION_MS = 400

function pickRandomIndex(exclude: number | number[], max: number): number {
  if (max <= 1) {
    return 0
  }

  const excluded = Array.isArray(exclude) ? exclude : [exclude]
  const candidates: number[] = []

  for (let i = 0; i < max; i++) {
    if (!excluded.includes(i)) {
      candidates.push(i)
    }
  }

  if (candidates.length === 0) {
    return Math.floor(Math.random() * max)
  }

  return candidates[Math.floor(Math.random() * candidates.length)]!
}

type Logo = Data.Component<"utilities.basic-image">

interface LogoSlot {
  logo: Logo
  state: "idle" | "exiting" | "entering"
  index: number
}

interface TestimonialLogosGridProps {
  readonly logos: Logo[]
}

export function TestimonialLogosGrid({ logos }: TestimonialLogosGridProps) {
  const shouldAnimate = logos.length > MAX_VISIBLE
  const [slots, setSlots] = useState<LogoSlot[]>(() =>
    logos
      .slice(0, MAX_VISIBLE)
      .map((logo, index) => ({ logo, state: "idle", index }))
  )

  // Next slot to swap (0–5, random each time)
  const nextSlotToSwapIndexRef = useRef(pickRandomIndex(-1, MAX_VISIBLE))

  const visibleLogoIndexesRef = useRef(slots.map((s) => s.index))

  useEffect(() => {
    if (!shouldAnimate) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      return
    }

    let swapTimeout: ReturnType<typeof setTimeout> | undefined
    let idleTimeout: ReturnType<typeof setTimeout> | undefined
    const interval = setInterval(() => {
      const slotIndex = nextSlotToSwapIndexRef.current
      const nextLogoIndex = pickRandomIndex(
        visibleLogoIndexesRef.current,
        logos.length
      )

      // Exit current logo
      setSlots((prev) =>
        prev.map((slot, i) =>
          i === slotIndex ? { ...slot, state: "exiting" } : slot
        )
      )

      // After fade-out, swap in new logo
      swapTimeout = setTimeout(() => {
        visibleLogoIndexesRef.current = visibleLogoIndexesRef.current.map(
          (visibleLogoIndex, i) =>
            i === slotIndex ? nextLogoIndex : visibleLogoIndex
        )

        setSlots((prev) =>
          prev.map((slot, i) =>
            i === slotIndex
              ? {
                  logo: logos[nextLogoIndex]!,
                  state: "entering",
                  index: nextLogoIndex,
                }
              : slot
          )
        )

        // After fade-in, settle to idle
        idleTimeout = setTimeout(() => {
          setSlots((prev) =>
            prev.map((slot, i) =>
              i === slotIndex ? { ...slot, state: "idle" } : slot
            )
          )
        }, ANIMATION_DURATION_MS)
      }, ANIMATION_DURATION_MS)

      nextSlotToSwapIndexRef.current = pickRandomIndex(slotIndex, MAX_VISIBLE)
    }, SWAP_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(swapTimeout)
      clearTimeout(idleTimeout)
    }
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
