"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

import type { NewsletterHubspotRef } from "@/components/newsletter/NewsletterForm"
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface BlogNewsletterPopoverProps {
  readonly hubspotForm?: NewsletterHubspotRef | null
}

export function BlogNewsletterPopover({
  hubspotForm,
}: BlogNewsletterPopoverProps) {
  const t = useTranslations("newsletter")
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineInverse" className="hidden sm:inline-flex">
          {t("submitLabel")}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="bg-strapi-gray-950 border-strapi-neutral-800 w-80 rounded-xl border p-6 text-white shadow-2xl sm:w-96"
      >
        <NewsletterSignup
          presentation="embedded"
          hubspotForm={hubspotForm}
          onFormSuccess={() => {
            setTimeout(() => {
              setOpen(false)
            }, 2000)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
