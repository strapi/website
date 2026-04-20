"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

import newsletterBg from "@/assets/images/newsletter-bg.webp"
import { Box } from "@/components/elementary/box/Box"
import { Container } from "@/components/elementary/Container"
import { HeroContainerBorder } from "@/components/elementary/HeroContainer"
import {
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"

import { NewsletterForm, type NewsletterHubspotRef } from "./NewsletterForm"

interface NewsletterSignupProps {
  readonly presentation: "banner" | "embedded"
  readonly hubspotForm?: NewsletterHubspotRef | null
  readonly onFormSuccess?: () => void
}

export function NewsletterSignup({
  presentation,
  hubspotForm,
  onFormSuccess,
}: NewsletterSignupProps) {
  const t = useTranslations("newsletter")
  const formLayout = presentation === "banner" ? "inline" : "stacked"

  const header = (
    <SectionHeader size="xs" layout="left" className="gap-0">
      <SectionTitle as="h4" size="sm" variant="inverse">
        {t("title")}
      </SectionTitle>
      <SectionDescription variant="inverse" size="sm">
        {t("description")}
      </SectionDescription>
    </SectionHeader>
  )

  const form = (
    <NewsletterForm
      hubspotForm={hubspotForm}
      variant="dark"
      layout={formLayout}
      onSuccess={onFormSuccess}
    />
  )

  if (presentation === "embedded") {
    return (
      <div className="flex flex-col gap-4">
        {header}
        {form}
      </div>
    )
  }

  return (
    <HeroContainerBorder className="rounded-strapi-lg overflow-x-clip">
      <Container className="rounded-strapi-lg relative">
        <div className="relative">
          <Box variant="dark" className="rounded-strapi-lg">
            <div className="relative z-10 flex w-full flex-col gap-6 px-8 py-12 lg:px-14 lg:py-18">
              {header}

              <div className="max-w-100">{form}</div>
            </div>
          </Box>

          <div className="pointer-events-none absolute right-0 bottom-0 hidden max-h-full px-8 lg:block">
            <Image
              src={newsletterBg}
              alt=""
              aria-hidden
              className="h-auto max-h-70 w-full object-contain object-bottom-right"
              sizes="(max-width: 1024px) 0px, 320px"
            />
          </div>
        </div>
      </Container>
    </HeroContainerBorder>
  )
}
