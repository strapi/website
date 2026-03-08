import type { Data } from "@repo/strapi-types"
import Image from "next/image"

import {
  SectionDescription,
  SectionHeader,
  SectionHeaderContainer,
  SectionTitle,
} from "@/components/elementary/section-header"
import { Button } from "@/components/ui/button"

import newsletterPaperPlane from "./newsletter-paper-plane.svg"

interface StrapiNewsletterProps {
  readonly component: Data.Component<"forms.newsletter">
}

export function StrapiNewsletter({ component }: StrapiNewsletterProps) {
  return (
    <SectionHeaderContainer
      background="darker"
      boxed
      className="py-10 lg:py-20"
      containerClassName="max-w-263"
      contentClassName="px-5 pt-20 pb-8 lg:px-5 lg:pt-14 lg:pb-12"
    >
      <div className="relative">
        <Image
          src={newsletterPaperPlane}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 z-[1] w-[125px]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-88 flex-col items-center">
          <SectionHeader size="xs" layout="center">
            <SectionTitle as="h2" size="xs" variant="inverse">
              {component.title}
            </SectionTitle>
            {component.description && (
              <SectionDescription variant="inverse" size="sm">
                {component.description}
              </SectionDescription>
            )}
          </SectionHeader>

          <form className="mt-5 flex w-full flex-col">
            <input
              type="email"
              aria-label="Email address"
              placeholder={
                component.emailPlaceholder ?? "Enter your email address"
              }
              className="mb-5 h-[46px] w-full rounded-[8px] border border-transparent bg-white px-4 text-sm text-black shadow-xs outline-none lg:mb-2.5"
            />
            <Button type="button" variant="purple" className="h-13 w-full">
              {component.submitLabel ?? "Subscribe"}
            </Button>
          </form>

          {component.consentText && (
            <p className="mt-5 w-full text-center text-sm leading-relaxed text-white">
              {component.consentText}
            </p>
          )}
        </div>
      </div>
    </SectionHeaderContainer>
  )
}
