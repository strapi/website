"use client"

import { XIcon } from "@phosphor-icons/react/ssr"
import type { Nullable } from "@repo/shared-data"
import type { Data } from "@repo/strapi-types"
import { type ReactNode, useState } from "react"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLink } from "@/components/page-builder/components/utilities/StrapiLink"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTitle,
} from "@/components/ui/popover"
import { cn } from "@/lib/styles"

interface NavbarMediaKitProps {
  readonly mediaKit: Nullable<Data.Component<"navigation.media-kit">>
  readonly children: ReactNode
}

export function NavbarMediaKit({ mediaKit, children }: NavbarMediaKitProps) {
  const [open, setOpen] = useState(false)

  if (!mediaKit) {
    return children
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className="shrink-0"
          onContextMenu={(event) => {
            event.preventDefault()
            setOpen(true)
          }}
        >
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        aria-labelledby={mediaKit.title ? "navbar-media-kit-title" : undefined}
        aria-label={mediaKit.title ? undefined : "Media kit"}
        className="bg-background w-[360px] rounded-[14px] border-0 p-10 shadow-[0px_2px_15px_0px_rgba(117,141,166,0.2142)]"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:animate-spring focus:ring-ring absolute top-6 right-6 cursor-pointer rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden [&_svg]:size-4"
        >
          <XIcon weight="bold" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center">
          {mediaKit.title ? (
            <PopoverTitle
              id="navbar-media-kit-title"
              className="mb-10 text-center text-xl font-semibold"
            >
              {mediaKit.title}
            </PopoverTitle>
          ) : null}

          {mediaKit.image ? (
            <StrapiBasicImage
              component={mediaKit.image}
              mode="responsive"
              sizes="190px"
              className="mx-auto mb-10 max-w-[190px]"
            />
          ) : null}

          {mediaKit.links?.length ? (
            <div className="flex w-full flex-col gap-3">
              {mediaKit.links.map((link, index) => (
                <StrapiLink
                  key={link.id ?? index}
                  component={link}
                  className={cn(
                    "w-full justify-center",
                    !link.decorations &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:no-underline"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
