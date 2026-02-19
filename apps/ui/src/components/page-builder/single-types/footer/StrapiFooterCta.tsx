"use client"

import { ArrowRightIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useState } from "react"

import { Container } from "@/components/elementary/Container"
import { SectionHeading } from "@/components/elementary/SectionHeading"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { getStrapiLinkHref } from "@/components/page-builder/components/utilities/StrapiLink"
import { formatHref, isAppLink, Link } from "@/lib/navigation"

export function StrapiFooterCta({
  component,
}: {
  readonly component: Data.Component<"sections.footer-cta">
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!component.codeSnippet) return

    await navigator.clipboard.writeText(component.codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="w-full"
      style={{
        background: "linear-gradient(180deg, #1c1c4e 0%, #292875 100%)",
      }}
    >
      <Container className="py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            as="h2"
            textStyle="h2"
            className="mb-8 text-center text-white"
          >
            {component.heading}
          </SectionHeading>

          {component.codeSnippet && (
            <div className="bg-strapi-neutral-900 mb-8 flex items-center justify-between gap-4 rounded-lg px-6 py-4">
              <code className="text-strapi-blue-300 font-mono text-sm">
                {component.codeSnippet}
              </code>

              <button
                type="button"
                onClick={handleCopy}
                className="bg-strapi-purple-600 hover:bg-strapi-purple-700 flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon size={13} weight="bold" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon size={13} />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}

          {component.featureBadges && component.featureBadges.length > 0 && (
            <div className="mb-8 flex flex-wrap justify-center gap-4">
              {component.featureBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  {badge.icon && (
                    <span className="relative size-4">
                      <StrapiBasicImage
                        component={badge.icon}
                        fill
                        className="object-contain"
                      />
                    </span>
                  )}
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          )}

          {component.featureLogos && component.featureLogos.length > 0 && (
            <div className="mb-12 flex flex-wrap justify-center gap-6">
              {component.featureLogos.map((logo) => (
                <span key={logo.id} className="relative h-8 w-20">
                  <StrapiBasicImage
                    component={logo}
                    fill
                    className="object-contain opacity-70"
                  />
                </span>
              ))}
            </div>
          )}

          {component.ctaCards && component.ctaCards.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {component.ctaCards.map((card) => {
                const href = getStrapiLinkHref(card.link)
                const formattedHref = href ? formatHref(href) : undefined
                const newTab = card.link?.newTab ?? false
                const linkLabel = card.link?.label ?? "Learn more"

                return (
                  <div
                    key={card.id}
                    className="rounded-lg bg-white/10 p-6 backdrop-blur-sm"
                  >
                    {card.icon && (
                      <span className="mb-3 block size-8">
                        <StrapiBasicImage
                          component={card.icon}
                          fallbackSizes={{ width: 32, height: 32 }}
                          className="size-8 object-contain"
                        />
                      </span>
                    )}

                    <h3 className="mb-2 text-sm font-bold text-white">
                      {card.title}
                    </h3>

                    {card.description && (
                      <p className="mb-4 text-sm text-white/70">
                        {card.description}
                      </p>
                    )}

                    {formattedHref && (
                      <>
                        {isAppLink(formattedHref) ? (
                          <Link
                            href={formattedHref}
                            target={newTab ? "_blank" : undefined}
                            rel={newTab ? "noopener" : undefined}
                            className="text-strapi-blue-300 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-white"
                          >
                            {linkLabel}
                            <ArrowRightIcon size={14} />
                          </Link>
                        ) : (
                          <a
                            href={formattedHref}
                            target={newTab ? "_blank" : undefined}
                            rel={newTab ? "noopener noreferrer" : undefined}
                            className="text-strapi-blue-300 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-white"
                          >
                            {linkLabel}
                            <ArrowRightIcon size={14} />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

StrapiFooterCta.displayName = "StrapiFooterCta"

export default StrapiFooterCta
