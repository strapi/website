"use client"

import { ListIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import Image from "next/image"
import { useState } from "react"

import AppLink from "@/components/elementary/AppLink"
import StrapiLink, {
  getStrapiLinkHref,
} from "@/components/page-builder/components/utilities/StrapiLink"
import { StrapiLinkImage } from "@/components/page-builder/components/utilities/StrapiLinkImage"
import { NavMenuLink } from "@/components/page-builder/single-types/navbar/NavMenuLink"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/styles"

interface MobileNavbarProps {
  readonly logoImage: Data.Component<"utilities.link-image"> | undefined | null
  readonly navItems: Data.Component<"navbar.nav-item">[] | undefined | null
  readonly ctaLinks: Data.Component<"utilities.link">[] | undefined | null
}

export function MobileNavbar({
  logoImage,
  navItems,
  ctaLinks,
}: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between px-4">
        {logoImage ? (
          <StrapiLinkImage
            component={logoImage}
            className="flex shrink-0 items-center"
          />
        ) : (
          <AppLink href="/" className="shrink-0 text-xl font-bold">
            <Image src="/images/logo.svg" alt="logo" height={23} width={82} />
          </AppLink>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <MagnifyingGlassIcon className="size-4" weight="bold" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <XIcon className="size-5" weight="bold" />
            ) : (
              <ListIcon className="size-5" weight="bold" />
            )}
          </Button>
        </div>
      </div>

      {/* Full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 overflow-y-auto bg-white">
          <nav className="flex flex-col px-4 pt-4 pb-8">
            {navItems?.length ? (
              <Accordion type="multiple" className="w-full">
                {navItems.map((item) => {
                  const hasSections = !!item.sections?.length

                  if (!hasSections) {
                    const href = getStrapiLinkHref(item.directLink)

                    return href ? (
                      <div key={item.id} className="border-b py-4">
                        <AppLink
                          href={href}
                          variant="ghost"
                          className="w-full justify-start px-0 text-sm font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </AppLink>
                      </div>
                    ) : null
                  }

                  return (
                    <AccordionItem key={item.id} value={`nav-${item.id}`}>
                      <AccordionTrigger className="text-sm font-medium">
                        {item.label}
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="flex flex-col gap-4 pb-2">
                          {item.sections?.map((section) => (
                            <div
                              key={section.id}
                              className="flex flex-col gap-1"
                            >
                              {section.title && (
                                <span className="text-muted-foreground px-2.5 text-xs font-semibold tracking-wider uppercase">
                                  {section.title}
                                </span>
                              )}

                              <div
                                className={cn(
                                  section.layout === "grid"
                                    ? "grid grid-cols-2 gap-1"
                                    : "flex flex-col gap-0.5"
                                )}
                              >
                                {section.items?.map((navLink) => (
                                  <div
                                    key={navLink.id}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <NavMenuLink component={navLink} compact />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {item.bottomLinks?.length ? (
                            <div className="border-t pt-3">
                              <div className="flex flex-col gap-1">
                                {item.bottomLinks.map((link) => (
                                  <div
                                    key={link.id}
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <StrapiLink
                                      component={link}
                                      className="text-sm font-medium"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : null}

            {/* CTA links */}
            {ctaLinks?.length ? (
              <div className="mt-6 flex flex-col gap-3">
                {ctaLinks.map((link, index) => (
                  <div key={link.id ?? index} onClick={() => setIsOpen(false)}>
                    <StrapiLink
                      component={link}
                      className={cn(
                        "w-full justify-center text-sm",
                        !link.decorations &&
                          index === 0 &&
                          "border-primary border",
                        !link.decorations &&
                          index > 0 &&
                          "bg-primary text-primary-foreground"
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </div>
  )
}

MobileNavbar.displayName = "MobileNavbar"
