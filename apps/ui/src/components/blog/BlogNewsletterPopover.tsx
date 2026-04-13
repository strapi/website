"use client"

import { useState } from "react"

import {
  type NewsletterFormData,
  NewsletterForm,
} from "@/components/newsletter/NewsletterForm"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface BlogNewsletterPopoverProps {
  readonly newsletter: NewsletterFormData
}

export function BlogNewsletterPopover({
  newsletter,
}: BlogNewsletterPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineInverse" className="hidden sm:inline-flex">
          Subscribe
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="bg-strapi-gray-950 border-strapi-neutral-800 w-80 rounded-xl border p-6 text-white shadow-2xl sm:w-96"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-white">
              {newsletter.title}
            </h3>
            {newsletter.description && (
              <p className="text-strapi-gray-400 text-sm">
                {newsletter.description}
              </p>
            )}
          </div>

          <NewsletterForm
            data={newsletter}
            variant="dark"
            layout="stacked"
            onSuccess={() => {
              setTimeout(() => setOpen(false), 2000)
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
