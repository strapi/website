import type { Data } from "@repo/strapi-types"
import type { CSSProperties, ImgHTMLAttributes } from "react"

import { logNonBlockingError, logNonBlockingWarning } from "@/lib/logging"
import { buildStrapiSrcSet } from "@/lib/strapi-helpers"
import { cn } from "@/lib/styles"
import type { StrapiImageMedia } from "@/types/api"

export type StrapiBasicImageMode = "intrinsic" | "responsive" | "fill"

const DEFAULT_BLUR_RGB: readonly [number, number, number] = [229, 231, 235]

interface Dimensions {
  readonly width: number
  readonly height: number
}

type NativeImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "height" | "src" | "srcSet" | "width"
>

export interface StrapiBasicImageProps extends NativeImgProps {
  readonly component: Data.Component<"utilities.basic-image"> | undefined | null
  readonly decorative?: boolean
  readonly hideWhenMissing?: boolean
  readonly mode?: StrapiBasicImageMode
  readonly priority?: boolean
  readonly transparentPlaceholder?: boolean
  readonly blurRgb?: readonly [number, number, number]
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

  if (mode !== "fill" && cmsDims == null && mediaDims == null) {
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
 * Renders a Strapi media asset with a responsive `srcSet` built from
 * `media.formats`. Uses a native `<img>` (not Next/Image) because the project
 * runs with `images.unoptimized: true` — Next/Image would ignore `srcSet` in
 * that mode and the browser would always download the original.
 *
 * Supported modes:
 * - `intrinsic` — render at the resolved width/height pair
 * - `responsive` — preserve aspect ratio while CSS controls rendered size
 * - `fill` — ignore CMS dimensions and fill a parent-owned box
 */
export function StrapiBasicImage({
  component,
  className,
  decorative = false,
  hideWhenMissing,
  mode = "intrinsic",
  priority,
  sizes,
  style,
  transparentPlaceholder,
  blurRgb,
  loading,
  ...imgProps
}: StrapiBasicImageProps) {
  const effectiveSizes =
    sizes ?? (mode === "fill" || mode === "responsive" ? "100vw" : undefined)

  const media = (component?.media ?? null) as StrapiImageMedia | null
  const srcSetData = buildStrapiSrcSet(media)

  const cmsDims = toDimensionPair(component?.width, component?.height)
  const mediaDims = toDimensionPair(srcSetData.width, srcSetData.height)

  const hasPartialCms =
    cmsDims == null &&
    (toPositiveInteger(component?.width) != null ||
      toPositiveInteger(component?.height) != null)

  emitDimensionWarnings(cmsDims, mediaDims, hasPartialCms, mode, effectiveSizes)

  if (!srcSetData.src) {
    if (!hideWhenMissing) {
      logNonBlockingError(
        "StrapiBasicImage did not receive a media URL and rendered nothing."
      )
    }

    return null
  }

  const dimensions = mode === "fill" ? undefined : (cmsDims ?? mediaDims)

  if (mode !== "fill" && dimensions == null) {
    logNonBlockingError(
      `StrapiBasicImage could not resolve dimensions for mode "${mode}" and rendered nothing.`
    )

    return null
  }

  const alt = decorative
    ? ""
    : (component?.alt ?? media?.caption ?? media?.alternativeText ?? "")

  const background = transparentPlaceholder
    ? undefined
    : `rgb(${(blurRgb ?? DEFAULT_BLUR_RGB).join(", ")})`

  const mergedStyle: CSSProperties = {
    ...(background ? { backgroundColor: background } : null),
    ...style,
  }

  const resolvedLoading = loading ?? (priority ? "eager" : "lazy")
  const fetchPriority = priority ? "high" : undefined

  const commonProps: ImgHTMLAttributes<HTMLImageElement> = {
    ...imgProps,
    alt,
    "aria-hidden": decorative || undefined,
    src: srcSetData.src,
    srcSet: srcSetData.srcSet,
    sizes: effectiveSizes,
    loading: resolvedLoading,
    fetchPriority,
    decoding: imgProps.decoding ?? "async",
  }

  if (mode === "fill") {
    return (
      // Native <img>: Next/Image ignores srcSet under images.unoptimized: true.
      // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
      <img
        {...commonProps}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        style={mergedStyle}
      />
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img
      {...commonProps}
      width={dimensions!.width}
      height={dimensions!.height}
      className={cn(mode === "responsive" && "h-auto max-w-full", className)}
      style={mergedStyle}
    />
  )
}
