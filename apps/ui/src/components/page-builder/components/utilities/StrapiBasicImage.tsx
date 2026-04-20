import type { Data } from "@repo/strapi-types"

import { ImageWithBlur } from "@/components/elementary/ImageWithBlur"
import { logNonBlockingError, logNonBlockingWarning } from "@/lib/logging"
import { formatStrapiMediaUrl } from "@/lib/strapi-helpers"
import { cn } from "@/lib/styles"
import type { StrapiImageMedia, StrapiImageMediaFormat } from "@/types/api"
import type { ImageExtendedProps } from "@/types/next"

export type StrapiBasicImageFormat = "large" | "medium" | "small" | "thumbnail"
export type StrapiBasicImageMode = "intrinsic" | "responsive" | "fill"

interface Dimensions {
  readonly width: number
  readonly height: number
}

export interface StrapiBasicImageProps extends Omit<
  ImageExtendedProps,
  "alt" | "fill" | "height" | "src" | "width"
> {
  readonly component: Data.Component<"utilities.basic-image"> | undefined | null
  readonly decorative?: boolean
  readonly format?: StrapiBasicImageFormat
  readonly hideWhenMissing?: boolean
  readonly mode?: StrapiBasicImageMode
  readonly transparentPlaceholder?: boolean
}

function toPositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined
  }

  return Math.round(value)
}

function toDimensionPair(
  width: unknown,
  height: unknown
): Dimensions | undefined {
  const w = toPositiveInteger(width)
  const h = toPositiveInteger(height)

  if (w == null || h == null) {
    return undefined
  }

  return { width: w, height: h }
}

function emitDimensionWarnings(
  cmsDims: Dimensions | undefined,
  formatDims: Dimensions | undefined,
  mediaDims: Dimensions | undefined,
  hasPartialCms: boolean,
  mode: StrapiBasicImageMode,
  sizes?: string
) {
  if (hasPartialCms) {
    logNonBlockingWarning(
      "StrapiBasicImage ignored partial CMS dimensions. Set both width and height or neither."
    )
  }

  if (
    mode !== "fill" &&
    cmsDims == null &&
    formatDims == null &&
    mediaDims == null
  ) {
    logNonBlockingError(
      `StrapiBasicImage mode "${mode}" requires a complete width/height pair from CMS or media metadata.`
    )
  }

  if ((mode === "fill" || mode === "responsive") && !sizes) {
    logNonBlockingWarning(
      `StrapiBasicImage mode "${mode}" should include a sizes prop for correct responsive image selection.`
    )
  }
}

/**
 * Supported usage patterns:
 * - `mode="intrinsic"`: render at the resolved width/height pair
 * - `mode="responsive"`: preserve aspect ratio while CSS controls rendered size
 * - `mode="fill"`: ignore CMS dimensions and fill a parent-owned box
 */
export function StrapiBasicImage({
  component,
  className,
  decorative = false,
  format,
  hideWhenMissing,
  mode = "intrinsic",
  sizes,
  style,
  transparentPlaceholder,
  ...imgProps
}: StrapiBasicImageProps) {
  const effectiveSizes =
    sizes ?? (mode === "fill" || mode === "responsive" ? "100vw" : undefined)

  const media = (component?.media ?? null) as StrapiImageMedia | null
  const selectedFormat = format
    ? (media?.formats?.[format] as StrapiImageMediaFormat | undefined)
    : undefined
  const src = formatStrapiMediaUrl(selectedFormat?.url ?? media?.url)

  const cmsDims = toDimensionPair(component?.width, component?.height)
  const formatDims = toDimensionPair(
    selectedFormat?.width,
    selectedFormat?.height
  )
  const mediaDims = toDimensionPair(media?.width, media?.height)

  const hasPartialCms =
    cmsDims == null &&
    (toPositiveInteger(component?.width) != null ||
      toPositiveInteger(component?.height) != null)

  emitDimensionWarnings(
    cmsDims,
    formatDims,
    mediaDims,
    hasPartialCms,
    mode,
    effectiveSizes
  )

  if (!src) {
    logNonBlockingError(
      "StrapiBasicImage did not receive a media URL and rendered nothing."
    )

    return null
  }

  const dimensions =
    mode === "fill" ? undefined : (cmsDims ?? formatDims ?? mediaDims)

  if (mode !== "fill" && dimensions == null) {
    logNonBlockingError(
      `StrapiBasicImage could not resolve dimensions for mode "${mode}" and rendered nothing.`
    )

    return null
  }

  const alt = decorative
    ? ""
    : (component?.alt ?? media?.caption ?? media?.alternativeText ?? "")

  const sharedProps = {
    ...imgProps,
    alt,
    "aria-hidden": decorative || undefined,
    className:
      mode === "responsive" ? cn("max-w-full h-auto", className) : className,
    sizes: effectiveSizes,
    src,
    style,
  }

  if (mode === "fill") {
    return (
      <ImageWithBlur
        {...sharedProps}
        fill
        transparentPlaceholder={transparentPlaceholder}
      />
    )
  }

  return (
    <ImageWithBlur
      {...sharedProps}
      width={dimensions!.width}
      height={dimensions!.height}
      transparentPlaceholder={transparentPlaceholder}
    />
  )
}
