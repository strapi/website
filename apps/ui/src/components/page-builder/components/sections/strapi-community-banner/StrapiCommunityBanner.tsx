import type { Data } from "@repo/strapi-types"
import Image from "next/image"

import communityBannerImage from "@/assets/images/community-banner.png"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

export function StrapiCommunityBanner({
  component,
}: {
  readonly component: Data.Component<"sections.community-banner">
}) {
  return (
    <section className="overflow-x-clip">
      <Container className="rounded-strapi-lg">
        <div className="relative">
          <Box variant="dark" className="rounded-strapi-lg lg:min-h-62">
            <div className="relative z-10 flex flex-col gap-8 px-8 py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-16 lg:py-12">
              <div className="flex max-w-full flex-1 flex-col gap-2.5 lg:max-w-80 xl:max-w-114">
                {component.title && (
                  <h4 className="text-background text-2xl font-medium tracking-tight">
                    {component.title}
                  </h4>
                )}

                {component.description && (
                  <p className="text-background/60 text-base leading-relaxed">
                    <InlineMarkdown>{component.description}</InlineMarkdown>
                  </p>
                )}

                {component.ctaLink && (
                  <div className="pt-2">
                    <StrapiLink component={component.ctaLink} />
                  </div>
                )}
              </div>
            </div>
          </Box>

          <div className="absolute -top-10 -right-8 hidden w-136 lg:block">
            <Image
              src={communityBannerImage}
              alt=""
              aria-hidden
              className="object-contain"
              sizes="(max-width: 1024px) 0px, 320px"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
