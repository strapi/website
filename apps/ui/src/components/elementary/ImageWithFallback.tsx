/* eslint-disable jsx-a11y/alt-text */
"use client"

import Image from "next/image"
import { type SyntheticEvent, useCallback, useEffect, useState } from "react"

import { FALLBACK_IMAGE_PATH } from "@/lib/constants"
import { cn } from "@/lib/styles"
import type { ImageExtendedProps } from "@/types/next"

import { ImageWithBlur } from "./ImageWithBlur"

const invalidSrc = "/invalid-src.jpg"

export function ImageWithFallback({
  fallbackSrc,
  src: originalSrc,
  blurOff,
  fadeIn,
  transparentPlaceholder,
  className,
  onLoad,
  ...imgProps
}: ImageExtendedProps & {
  blurOff?: boolean
  fadeIn?: boolean
  transparentPlaceholder?: boolean
}) {
  const [src, setSrc] = useState(originalSrc ?? fallbackSrc ?? invalidSrc)
  const [loaded, setLoaded] = useState(!fadeIn)

  useEffect(() => {
    setSrc(originalSrc ?? fallbackSrc ?? invalidSrc)

    if (fadeIn) {
      setLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalSrc])

  const handleLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      if (fadeIn) {
        setLoaded(true)
      }

      onLoad?.(e)
    },
    [fadeIn, onLoad]
  )

  const handleLoadError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`Error loading image from ${src}:`, e)

    if (fallbackSrc) {
      setSrc(fallbackSrc)
    } else {
      setSrc(FALLBACK_IMAGE_PATH)
    }

    imgProps?.onError?.(e)
  }

  const resolvedClassName = fadeIn
    ? cn(
        "transition-opacity duration-300 ease-in",
        loaded ? "opacity-100" : "opacity-0",
        className
      )
    : className

  if (blurOff) {
    return (
      <Image
        src={src}
        className={resolvedClassName}
        onLoad={handleLoad}
        onError={handleLoadError}
        {...imgProps}
      />
    )
  }

  return (
    <ImageWithBlur
      src={src}
      transparentPlaceholder={transparentPlaceholder}
      className={resolvedClassName}
      onLoad={handleLoad}
      onError={handleLoadError}
      {...imgProps}
    />
  )
}
