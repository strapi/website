"use client"

import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

const alignmentClasses = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const

/**
 * Formats a YouTube URL into an embeddable URL.
 * Supports youtube.com/watch?v=, youtu.be/, and youtube.com/embed/ formats.
 */
function formatYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    // Already an embed URL
    if (parsed.pathname.startsWith("/embed/")) {
      return url
    }

    // youtube.com/watch?v=VIDEO_ID
    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.searchParams.has("v")
    ) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`
    }

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`
    }

    return null
  } catch {
    return null
  }
}

export function StrapiVideo({
  component,
}: {
  readonly component: Data.Component<"media.video">
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const alignment = component.alignment ?? "center"

  if (!component.url) {
    return null
  }

  const embedUrl = formatYoutubeEmbedUrl(component.url)

  if (!embedUrl) {
    return null
  }

  const hasThumbnail =
    component.thumbnail?.media || component.thumbnail?.fallbackSrc

  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className={cn("flex", alignmentClasses[alignment])}>
          <div className="rounded-strapi-lg relative w-full overflow-hidden">
            {hasThumbnail && !isPlaying ? (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="group relative block aspect-video w-full cursor-pointer"
                aria-label="Play video"
              >
                <StrapiBasicImage
                  component={component.thumbnail}
                  fill
                  className="object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 lg:size-20">
                    <svg
                      className="text-strapi-neutral-900 ml-1 size-6 lg:size-8"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            ) : (
              <div className="aspect-video w-full">
                <iframe
                  src={`${embedUrl}${hasThumbnail ? "?autoplay=1" : ""}`}
                  title="Video player"
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
