import type { Data } from "@repo/strapi-types"

import { AppLinkUnstyled } from "@/components/elementary/AppLinkUnstyled"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import { buildStrapiSrcSet } from "@/lib/strapi-helpers"
import { cn } from "@/lib/styles"
import type { StrapiImageMedia } from "@/types/api"

const cardSurfaceClass = cn(
  "border-strapi-neutral-300 rounded-strapi-lg flex h-full flex-col gap-8 border bg-white p-8",
  "shadow-[0_4px_12px_rgba(41,40,117,0.08)]"
)

// Avatar / logo are direct Strapi media fields on api::review.review,
// so we build an <img> from buildStrapiSrcSet instead of going through
// StrapiBasicImage (which expects a utilities.basic-image component).
function MediaImg({
  media,
  alt,
  className,
  sizes,
}: {
  readonly media: StrapiImageMedia | null | undefined
  readonly alt: string
  readonly className?: string
  readonly sizes?: string
}) {
  const { src, srcSet, width, height } = buildStrapiSrcSet(media)

  if (!src) {
    return null
  }

  // Native <img> mirrors StrapiBasicImage's approach (Next/Image ignores
  // srcSet under images.unoptimized: true).

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
}

export function ReviewCard({
  review,
}: {
  readonly review: Data.ContentType<"api::review.review">
}) {
  const { quote, authorName, authorRole, authorAvatar, logo, link } = review

  const linkHref = getStrapiLinkHref(link)
  const logoMedia = logo as StrapiImageMedia | null | undefined
  const avatarMedia = authorAvatar as StrapiImageMedia | null | undefined

  const content = (
    <>
      {logoMedia && (
        <div className="flex h-12 items-center">
          <MediaImg
            media={logoMedia}
            alt={logoMedia.alternativeText ?? ""}
            sizes="140px"
            className="max-h-10 w-auto max-w-[140px] object-contain"
          />
        </div>
      )}

      <div className="text-strapi-neutral-700 flex-1 text-base leading-relaxed">
        <InlineMarkdown allowNewLines>{quote}</InlineMarkdown>
      </div>

      <div className="flex items-center gap-4">
        {avatarMedia && (
          <div className="bg-strapi-neutral-200 relative size-12 shrink-0 overflow-hidden rounded-full">
            <MediaImg
              media={avatarMedia}
              alt=""
              sizes="48px"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}

        <div className="text-sm">
          {authorName && (
            <span className="text-strapi-blue-600 font-bold">{authorName}</span>
          )}
          {authorRole && (
            <span className="text-strapi-neutral-700">
              {authorName ? ", " : ""}
              {authorRole}
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (linkHref) {
    return (
      <AppLinkUnstyled
        href={linkHref}
        openInNewTab={link?.newTab ?? false}
        className={cn(
          cardSurfaceClass,
          "animate-spring-sm no-underline transition-shadow hover:shadow-[0_8px_20px_rgba(41,40,117,0.12)]"
        )}
      >
        {content}
      </AppLinkUnstyled>
    )
  }

  return <div className={cardSurfaceClass}>{content}</div>
}
