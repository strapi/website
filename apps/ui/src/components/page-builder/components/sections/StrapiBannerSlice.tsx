import type { Data } from "@repo/strapi-types"

import { AppLink } from "@/components/elementary/AppLink"
import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import { cn } from "@/lib/styles"

export function StrapiBannerSlice({
  component,
}: {
  readonly component: Data.Component<"sections.banner-slice">
}) {
  const isDark = component.backgroundVariant === "dark"

  return (
    <section className="py-16 lg:py-20">
      <Container>
        <div
          className={cn(
            isDark &&
              "rounded-strapi-lg bg-strapi-blue-800 overflow-hidden px-8 py-20 lg:py-28"
          )}
        >
          <SectionHeader>
            <SectionLabel variant={isDark ? "inverse" : "default"}>
              {component.label}
            </SectionLabel>
            <SectionTitle as="h2" variant={isDark ? "inverse" : "default"}>
              {component.heading}
            </SectionTitle>
            <SectionDescription variant={isDark ? "inverse" : "default"}>
              {component.description}
            </SectionDescription>

            {component.ctas && component.ctas.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {component.ctas.map((cta, index) => {
                  const href = getStrapiLinkHref(cta)

                  if (!href) return null

                  const isFirst = index === 0

                  return (
                    <AppLink
                      key={cta.id}
                      href={href}
                      openInNewTab={cta.newTab ?? false}
                      variant={
                        isDark
                          ? isFirst
                            ? "secondary"
                            : "outline"
                          : isFirst
                            ? "default"
                            : "outline"
                      }
                      className={cn(
                        isDark &&
                          !isFirst &&
                          "border-white text-white hover:bg-white/10"
                      )}
                    >
                      {cta.label}
                    </AppLink>
                  )
                })}
              </div>
            )}
          </SectionHeader>
        </div>
      </Container>
    </section>
  )
}
