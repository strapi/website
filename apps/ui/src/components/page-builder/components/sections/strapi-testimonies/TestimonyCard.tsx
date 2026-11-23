import { PlayIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import type { StrapiImageMedia } from "@/types/api"

function testimonyLinkLabel(
  image: Data.Component<"utilities.basic-image"> | null | undefined,
  fallback: string
) {
  const media = (image?.media ?? null) as StrapiImageMedia | null
  const label =
    image?.alt?.trim() ||
    media?.alternativeText?.trim() ||
    media?.caption?.trim()

  return label || fallback
}

export function TestimonyCard({
  item,
}: {
  readonly item: Data.Component<"elements.testimony-item">
}) {
  const t = useTranslations("sections.testimonies")
  const content = (
    <div className="bg-strapi-neutral-200 relative aspect-video w-full overflow-hidden rounded-lg">
      <StrapiBasicImage
        component={item.image}
        mode="fill"
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        decorative
      />
      <div className="absolute top-1/2 left-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85">
        <PlayIcon size={24} weight="fill" className="text-strapi-neutral-800" />
      </div>
    </div>
  )

  if (item.videoUrl) {
    return (
      <a
        href={item.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={testimonyLinkLabel(item.image, t("watchVideo"))}
        className="animate-spring-sm block no-underline hover:opacity-90"
      >
        {content}
      </a>
    )
  }

  return content
}
