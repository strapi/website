"use client"

import { ArrowRightIcon } from "@phosphor-icons/react"
import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { SectionTitle } from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLinkText } from "@/components/page-builder/components/utilities/StrapiLinkText"
import { useClip } from "@/hooks/useClip"

export function StrapiFooterCta({
  component,
}: {
  readonly component: Data.Component<"footer.footer-cta">
}) {
  const { copied, copy } = useClip()

  const handleCopy = async () => {
    await copy(component.codeSnippet)
  }

  return (
    <section className="w-full">
      <Container className="py-30">
        <div className="flex flex-col gap-14 lg:flex-row lg:gap-20">
          <div className="flex flex-1 flex-col items-start gap-14">
            <SectionTitle as="h2" size="sm">
              {component.heading}
            </SectionTitle>

            <div className="flex flex-col gap-6">
              {component.codeSnippet && (
                <div className="border-strapi-neutral-200 flex w-full max-w-full items-center rounded-lg border bg-white shadow-sm sm:w-fit">
                  <pre className="text-strapi-neutral-800 min-w-0 flex-1 overflow-x-auto py-4 pr-4 pl-4 font-mono text-sm sm:pl-6 sm:text-base">
                    {component.codeSnippet}
                  </pre>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-strapi-purple-600 hover:text-strapi-purple-700 shrink-0 pr-4 text-sm font-semibold transition-colors sm:pr-6 sm:text-base"
                    aria-label={copied ? "Code copied" : "Copy code"}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}

              {component.featureBadges &&
                component.featureBadges.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-6">
                    {component.featureBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-1.5">
                        {badge.icon && (
                          <span className="relative size-5 shrink-0">
                            <StrapiBasicImage
                              component={badge.icon}
                              mode="fill"
                              className="object-contain"
                              sizes="20px"
                              decorative
                            />
                          </span>
                        )}
                        <span className="text-foreground text-base font-semibold">
                          {badge.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {component.featureLogos && component.featureLogos.length > 0 && (
              <div className="flex flex-wrap items-center gap-10">
                {component.featureLogos.map((logo) => (
                  <span key={logo.id} className="relative h-8 w-28">
                    <StrapiBasicImage
                      component={logo}
                      mode="fill"
                      className="object-contain"
                      sizes="112px"
                      decorative
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {component.ctaCards && component.ctaCards.length > 0 && (
            <div className="flex flex-1 flex-col gap-14">
              {component.ctaCards.map((card) => (
                <div key={card.id} className="flex gap-8">
                  <div className="bg-strapi-neutral-200 w-0.75 shrink-0 self-stretch rounded-full" />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      {card.icon && (
                        <span className="relative mt-0.5 size-6 shrink-0">
                          <StrapiBasicImage
                            component={card.icon}
                            mode="fill"
                            className="object-contain"
                            sizes="24px"
                            decorative
                          />
                        </span>
                      )}
                      <p className="text-foreground text-2xl font-semibold">
                        {card.title}
                      </p>
                    </div>

                    {card.description && (
                      <p className="text-strapi-neutral-700 mb-4 text-lg">
                        {card.description}
                      </p>
                    )}

                    <div className="text-strapi-blue-600 flex items-center justify-start gap-2 text-base font-semibold">
                      <div className="hover:animate-spring inline-flex items-center justify-start gap-2">
                        <StrapiLinkText component={card.link} className="" />
                        <ArrowRightIcon className="size-4" weight="bold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
