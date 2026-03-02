"use client"

import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import { Container } from "@/components/elementary/Container"
import { SectionTitle } from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import { Typography } from "@/components/typography"

export function StrapiFooterCta({
  component,
}: {
  readonly component: Data.Component<"footer.footer-cta">
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!component.codeSnippet) return

    await navigator.clipboard.writeText(component.codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      className="w-full"
      style={{
        background:
          "linear-gradient(359.75deg, #f2f4ff -63.96%, #ffffff 55.16%)",
      }}
    >
      <Container className="py-30">
        <div className="flex flex-col gap-14 lg:flex-row lg:gap-20">
          <div className="flex flex-1 flex-col items-start gap-14">
            <SectionTitle as="h2" size="sm">
              {component.heading}
            </SectionTitle>

            <div className="flex flex-col gap-6">
              {component.codeSnippet && (
                <div className="border-strapi-neutral-200 flex w-fit items-center rounded-lg border bg-white shadow-sm">
                  <pre className="text-strapi-neutral-800 py-4 pr-4 pl-6 font-mono text-base">
                    {component.codeSnippet}
                  </pre>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-strapi-purple-500 hover:text-strapi-purple-600 pr-6 text-base font-semibold transition-colors"
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
                              fill
                              className="object-contain"
                            />
                          </span>
                        )}
                        <span className="text-strapi-blue-800 text-base font-semibold">
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
                      fill
                      className="object-contain"
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
                            fill
                            className="object-contain"
                          />
                        </span>
                      )}
                      <Typography
                        tag="p"
                        variant="subtitle1"
                        fontWeight="semiBold"
                      >
                        {card.title}
                      </Typography>
                    </div>

                    {card.description && (
                      <Typography
                        tag="p"
                        variant="body1"
                        textColor="neutral"
                        className="mb-4"
                      >
                        {card.description}
                      </Typography>
                    )}

                    <StrapiLink component={card.link} />
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
