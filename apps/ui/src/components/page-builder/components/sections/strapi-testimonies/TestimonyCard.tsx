import { PlayIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export function TestimonyCard({
  item,
}: {
  readonly item: Data.Component<"elements.testimony-item">
}) {
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
        className="animate-spring-sm block no-underline hover:opacity-90"
      >
        {content}
      </a>
    )
  }

  return content
}
