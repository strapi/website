import type { Data } from "@repo/strapi-types"

import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"

export function StrapiResourceCta({
  component,
}: {
  readonly component: Data.Component<"blog.resource-cta">
}) {
  return (
    <section className="py-8 lg:py-16">
      <Container>
        <Box variant="dark" className="rounded-strapi-lg">
          <div className="relative z-10 flex flex-col gap-5 px-8 py-10 lg:px-12 lg:py-14">
            {component.badge && (
              <span className="bg-strapi-purple-500/20 text-strapi-purple-400 w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
                {component.badge}
              </span>
            )}

            <h3 className="text-2xl font-bold text-white">{component.title}</h3>

            {component.description && (
              <p className="text-strapi-gray-400 max-w-md text-sm leading-relaxed">
                {component.description}
              </p>
            )}

            {component.ctaLink && (
              <div className="mt-2">
                <StrapiLink component={component.ctaLink} />
              </div>
            )}
          </div>
        </Box>
      </Container>
    </section>
  )
}
