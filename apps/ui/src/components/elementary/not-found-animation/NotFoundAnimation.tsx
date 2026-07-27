"use client"

import type { AnimationItem } from "lottie-web"
import lottieLight from "lottie-web/build/player/lottie_light"
import { useEffect, useId, useRef } from "react"

import { cn } from "@/lib/styles"

// Animation data fetched from old API
import animationData from "./not-found-404-animation.json"

export function NotFoundAnimation({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  const name = useId()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    lottieLight.setQuality("low")

    const animation = lottieLight.loadAnimation({
      name,
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      // lottie mutates the payload; clone so Strict Mode remounts stay clean
      animationData: structuredClone(animationData),
      rendererSettings: {
        progressiveLoad: true,
        preserveAspectRatio: "xMidYMid meet",
      },
    })

    animationRef.current = animation

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (prefersReducedMotion) {
      animation.goToAndStop(animation.totalFrames - 1, true)
    } else {
      animation.play()
    }

    return () => {
      lottieLight.destroy(name)
      animationRef.current = null
    }
  }, [name])

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto aspect-800/300 w-full max-w-[850px] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full",
        className
      )}
      role="img"
      aria-label="404"
    />
  )
}
