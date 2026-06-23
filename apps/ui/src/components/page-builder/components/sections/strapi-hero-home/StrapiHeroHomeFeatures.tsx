"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { formatStrapiMediaUrl } from "@/lib/strapi-helpers"
import { cn } from "@/lib/styles"

import {
  HERO_AUTOPLAY_DEFAULT_DURATION_MS,
  StrapiHeroFeatureTabItem,
} from "./StrapiHeroFeatureTabItem"
import { HeroFeatureVideo } from "./StrapiHeroFeatureVideo"

interface HeroHomeFeatureMedia {
  readonly alternativeText?: string | null
  readonly caption?: string | null
  readonly height?: number | null
  readonly mime?: string | null
  readonly name?: string | null
  readonly url?: string | null
  readonly width?: number | null
}

export interface StrapiHeroHomeFeaturesProps extends React.ComponentProps<"div"> {
  readonly features: Nullable<Data.Component<"elements.hero-home-feature">[]>
}

function normalizeMedia(
  media:
    | Data.Component<"elements.hero-home-feature">["media"]
    | null
    | undefined
): HeroHomeFeatureMedia | null {
  if (!media || Array.isArray(media)) {
    return null
  }

  return media as HeroHomeFeatureMedia
}

function isVideoMedia(media: HeroHomeFeatureMedia | null): boolean {
  if (!media?.mime) {
    return false
  }

  return media.mime.startsWith("video/")
}

function getMediaAlt(
  media: HeroHomeFeatureMedia | null,
  title: string
): string {
  if (media?.alternativeText) {
    return media.alternativeText
  }

  if (media?.caption) {
    return media.caption
  }

  if (media?.name) {
    return media.name
  }

  return title
}

export function StrapiHeroHomeFeatures({
  className,
  features,
  ...restProps
}: StrapiHeroHomeFeaturesProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>(
    {}
  )

  const baseId = useId()
  const paused = !inView

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    watchDrag: false,
    duration: 20,
  })

  /**
   * Precompute normalized media to avoid duplicate work in render loops
   */
  const normalizedFeatures = useMemo(
    () =>
      features?.map((feature) => {
        const media = normalizeMedia(feature.media)

        return {
          feature,
          media,
          isVideo: isVideoMedia(media),
          mediaUrl: formatStrapiMediaUrl(media?.url),
        }
      }),
    [features]
  )

  /**
   * Pause when scrolled out of viewport
   */
  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setInView(entry.isIntersecting)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [])

  /**
   * Sync Embla's selected index to React state
   */
  useEffect(() => {
    if (!emblaApi) {
      return
    }

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  const handleAdvance = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const handleTabClick = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi]
  )

  const handleVideoDurationReady = useCallback(
    (index: number, durationMs: number) => {
      setVideoDurations((prev) => ({ ...prev, [index]: durationMs }))
    },
    []
  )

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return
      }

      if (!features) {
        return
      }

      event.preventDefault()

      const direction = event.key === "ArrowLeft" ? -1 : 1
      const nextIndex =
        (activeIndex + direction + features.length) % features.length

      emblaApi?.scrollTo(nextIndex)
      document.getElementById(`${baseId}-tab-${nextIndex}`)?.focus()
    },
    [activeIndex, features, baseId, emblaApi]
  )

  if (!features || features.length === 0) {
    return null
  }

  const hasMultipleFeatures = features.length > 1

  // Determine autoplay duration for the active feature
  const activeNormalized = normalizedFeatures?.[activeIndex]
  const activeAutoplayDuration = activeNormalized?.isVideo
    ? (videoDurations[activeIndex] ?? 0)
    : HERO_AUTOPLAY_DEFAULT_DURATION_MS

  return (
    <div
      ref={rootRef}
      className={cn(
        "animate-reveal-cascade flex flex-col-reverse [--reveal-delay:680ms] lg:flex-col",
        className
      )}
      {...restProps}
    >
      {hasMultipleFeatures ? (
        <div
          role="tablist"
          aria-label="Hero feature previews"
          className="relative flex w-full"
          onKeyDown={handleTabKeyDown}
        >
          {normalizedFeatures?.map(({ feature, isVideo }, index) => {
            const isActive = index === activeIndex
            const tabId = `${baseId}-tab-${index}`
            const panelId = `${baseId}-panel-${index}`

            return (
              <StrapiHeroFeatureTabItem
                key={feature.id}
                id={tabId}
                aria-controls={panelId}
                aria-selected={isActive}
                active={isActive}
                animationKey={activeIndex}
                paused={isActive ? paused : false}
                autoplayDuration={isActive ? activeAutoplayDuration : undefined}
                feature={feature}
                onProgressComplete={
                  isActive && !isVideo ? handleAdvance : undefined
                }
                onClick={() => handleTabClick(index)}
              />
            )
          })}

          <div className="absolute top-0 right-0 flex h-full w-full items-center justify-between text-white lg:hidden">
            <button
              type="button"
              aria-label="Previous feature"
              className="animate-spring-lg mx-2 flex size-8 items-center justify-center rounded-full"
              onClick={() => emblaApi?.scrollPrev()}
            >
              <CaretLeftIcon weight="bold" className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next feature"
              className="animate-spring-lg mx-2 flex size-8 items-center justify-center rounded-full"
              onClick={() => emblaApi?.scrollNext()}
            >
              <CaretRightIcon weight="bold" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="ring-strapi-gray-700/50 bg-strapi-gray-950 rounded-t-strapi-lg lg:rounded-strapi-lg relative aspect-[16/9] overflow-hidden ring">
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {normalizedFeatures?.map(
              ({ feature, media, isVideo, mediaUrl }, index) => {
                const isActive = index === activeIndex
                const panelId = `${baseId}-panel-${index}`

                return (
                  <div
                    key={feature.id}
                    id={panelId}
                    role="tabpanel"
                    aria-labelledby={`${baseId}-tab-${index}`}
                    aria-hidden={!isActive}
                    className="relative min-w-0 shrink-0 grow-0 basis-full"
                  >
                    {mediaUrl ? (
                      isVideo ? (
                        <HeroFeatureVideo
                          index={index}
                          src={mediaUrl}
                          isActive={isActive}
                          paused={paused}
                          onDurationReady={handleVideoDurationReady}
                          onEnded={handleAdvance}
                        />
                      ) : (
                        <Image
                          src={mediaUrl}
                          alt={getMediaAlt(media, feature?.title ?? "")}
                          fill
                          sizes="(max-width: 767px) 100vw, 1200px"
                          className="object-contain object-center"
                          priority={index === 0}
                        />
                      )
                    ) : (
                      <div className="flex size-full items-center justify-center px-6 text-center text-sm text-white/60">
                        Media missing for {feature?.title ?? "feature preview"}
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
