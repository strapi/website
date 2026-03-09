"use client"

import { memo, useEffect, useRef } from "react"

export interface HeroFeatureVideoProps {
  readonly index: number
  readonly isActive: boolean
  readonly paused: boolean
  readonly src: string
  readonly onDurationReady: (index: number, durationMs: number) => void
  readonly onEnded: () => void
}

export const HeroFeatureVideo = memo(
  ({
    index,
    isActive,
    paused,
    src,
    onDurationReady,
    onEnded,
  }: HeroFeatureVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const durationReportedRef = useRef(false)

    // Report video duration via native event listener
    useEffect(() => {
      const video = videoRef.current

      if (!video) {
        return
      }

      function reportDuration() {
        if (durationReportedRef.current) {
          return
        }

        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
          return
        }

        durationReportedRef.current = true
        onDurationReady(index, video.duration * 1000)
      }

      // Metadata may already be loaded (preload or cached)
      if (video.readyState >= 1) {
        reportDuration()

        return
      }

      video.addEventListener("loadedmetadata", reportDuration)

      return () => {
        video.removeEventListener("loadedmetadata", reportDuration)
      }
    }, [index, onDurationReady])

    // Play / pause based on active + paused state
    useEffect(() => {
      const video = videoRef.current

      if (!video || !isActive) {
        return
      }

      if (!paused) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }, [isActive, paused])

    // Reset video when becoming active
    useEffect(() => {
      const video = videoRef.current

      if (!video || !isActive) {
        return
      }

      video.currentTime = 0
    }, [isActive])

    return (
      <video
        ref={videoRef}
        src={src}
        className="block size-full object-contain object-center"
        preload="metadata"
        muted
        playsInline
        onEnded={() => {
          if (isActive) {
            onEnded()
          }
        }}
      />
    )
  }
)
