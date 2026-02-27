import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { formatHref, isAppLink, Link } from "@/lib/navigation"

export function StrapiAuthorBanner({
  component,
}: {
  readonly component: Data.Component<"blog.author-banner">
}) {
  const nameContent = (
    <span className="text-strapi-neutral-800 text-base font-medium">
      {component.authorName}
    </span>
  )

  return (
    <section className="py-8 lg:py-18">
      <Container>
        <div className="bg-strapi-neutral-200 h-px" />

        <div className="flex flex-col pt-8 pb-8 lg:flex-row lg:items-center lg:pb-10">
          {component.authorAvatar && (
            <div className="relative mb-4 size-16 shrink-0 overflow-hidden rounded-full lg:mr-7 lg:mb-0">
              <StrapiBasicImage
                component={component.authorAvatar}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {component.authorUrl ? (
                isAppLink(component.authorUrl) ? (
                  <Link href={formatHref(component.authorUrl)}>
                    {nameContent}
                  </Link>
                ) : (
                  <a
                    href={formatHref(component.authorUrl)}
                    rel="noopener noreferrer"
                  >
                    {nameContent}
                  </a>
                )
              ) : (
                nameContent
              )}

              {component.authorRole && (
                <span className="text-strapi-purple-600 text-xs font-medium">
                  {component.authorRole}
                </span>
              )}
            </div>

            {component.authorBio && (
              <p className="text-strapi-neutral-800 text-sm">
                {component.authorBio}
              </p>
            )}
          </div>
        </div>

        <div className="bg-strapi-neutral-200 h-px" />
      </Container>
    </section>
  )
}

StrapiAuthorBanner.displayName = "StrapiAuthorBanner"

export default StrapiAuthorBanner
