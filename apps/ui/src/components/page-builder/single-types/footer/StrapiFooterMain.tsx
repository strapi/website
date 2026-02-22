import type { Data } from "@repo/strapi-types"
import Image from "next/image"
import { Fragment } from "react"

import { Container } from "@/components/elementary/Container"
import { StrapiLinkImage } from "@/components/page-builder/components/utilities/StrapiLinkImage"
import { StrapiLinkText } from "@/components/page-builder/components/utilities/StrapiLinkText"

import gdprBadge from "./badges/gdpr.svg"
import soc2Badge from "./badges/soc2.png"

export function StrapiFooterMain({
  component,
}: {
  readonly component: Data.Component<"footer.footer-main">
}) {
  const copyRight = component.copyRight?.replace?.(
    "{YEAR}",
    new Date().getFullYear().toString()
  )
  const sectionCount = component.sections?.length ?? 0

  return (
    <div
      className="bg-white"
      style={{
        backgroundImage:
          "linear-gradient(359.75deg, rgb(242, 244, 255) -63.96%, rgb(255, 255, 255) 55.16%)",
      }}
    >
      <Container className="py-8 sm:py-15">
        <div
          className="grid grid-cols-1 gap-8 pb-12 sm:grid-cols-2 sm:gap-y-10 sm:pb-30 md:grid-cols-3 lg:grid-cols-[2fr_repeat(var(--section-count),1fr)]"
          style={{ "--section-count": sectionCount } as React.CSSProperties}
        >
          <div className="flex flex-col gap-5 sm:gap-10">
            <StrapiLinkImage
              component={component.logoImage}
              className="h-8 w-28"
            />

            {component.tagline && (
              <>
                <p className="w-full text-xs leading-relaxed sm:max-w-xs">
                  {component.tagline}
                </p>

                <div className="flex items-center gap-6">
                  <Image src={soc2Badge} alt="SOC 2 certified" height={64} />
                  <Image src={gdprBadge} alt="GDPR compliant" height={64} />
                </div>
              </>
            )}
          </div>

          {component.sections?.map((section) => (
            <div className="flex flex-col gap-6 sm:gap-8" key={section.id}>
              <h4 className="text-base font-semibold uppercase">
                {section.title}
              </h4>

              <nav>
                <ul className="flex list-none flex-col gap-3 leading-none">
                  {section.links?.map((link) => (
                    <li key={link.id}>
                      <StrapiLinkText
                        component={link}
                        className="text-strapi-neutral-700 spring-bounce inline-block text-sm leading-[1.2]"
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        <div className="border-border flex flex-col gap-4 border-t pt-8 text-sm md:flex-row md:items-center md:justify-between">
          <div className="text-foreground flex flex-wrap items-center gap-x-8">
            {copyRight && <span className="text-foreground">{copyRight}</span>}

            {component.links?.map((link) => (
              <Fragment key={link.id}>
                <StrapiLinkText component={link} />
              </Fragment>
            ))}
          </div>

          {component.socials && (
            <div className="flex items-center gap-3">
              {component.socials.title && (
                <span className="text-strapi-neutral-500">
                  {component.socials.title}
                </span>
              )}

              {component.socials.socials?.map((social) => (
                <StrapiLinkImage
                  key={social.id}
                  component={social}
                  className="spring-bounce spring-bounce-pop size-5"
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
