import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

export function ConversionInfoBlock({
  block,
}: {
  readonly block: Data.Component<"elements.conversion-info-block">
}) {
  const hasLogos = block.logos && block.logos.length > 0
  const hasItems = block.items && block.items.length > 0

  return (
    <div className="flex flex-col gap-3">
      {hasLogos && (
        <div className="flex items-center gap-3">
          {block.logos!.map((logo) => (
            <StrapiBasicImage
              key={logo.id}
              component={logo}
              mode="responsive"
              className="h-10 w-auto object-contain"
              sizes="40px"
              decorative
            />
          ))}
        </div>
      )}

      <h3 className="text-foreground text-lg font-semibold">{block.title}</h3>

      {block.description && (
        <p className="text-strapi-neutral-600 text-sm leading-relaxed">
          {block.description}
        </p>
      )}

      {hasItems && (
        <div className="mt-2 grid auto-cols-fr grid-flow-col gap-4">
          {block.items!.map((item) => (
            <ConversionInfoItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConversionInfoItem({
  item,
}: {
  readonly item: Data.Component<"elements.conversion-info-item">
}) {
  const hasValue = Boolean(item.value)

  if (hasValue) {
    // Stats layout: big number + label + company logo
    return (
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-foreground text-3xl font-bold tracking-tight">
            {item.value}
          </p>

          <p className="text-strapi-neutral-600 text-sm">{item.label}</p>
        </div>

        {item.image && (
          <StrapiBasicImage
            component={item.image}
            mode="responsive"
            className="mt-1 h-5 w-auto object-contain object-left"
            sizes="80px"
            decorative
          />
        )}
      </div>
    )
  }

  // Badge layout: image + label + description
  return (
    <div className="flex items-start gap-3">
      {item.image && (
        <StrapiBasicImage
          component={item.image}
          mode="responsive"
          className="h-10 w-auto shrink-0 object-contain"
          sizes="40px"
          decorative
        />
      )}

      <div>
        <p className="text-foreground text-sm font-semibold">{item.label}</p>

        {item.description && (
          <p className="text-strapi-neutral-600 text-xs">{item.description}</p>
        )}
      </div>
    </div>
  )
}
