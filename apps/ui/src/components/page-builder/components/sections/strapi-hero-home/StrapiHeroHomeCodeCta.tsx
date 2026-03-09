"use client"

import { CopyButton } from "@/components/elementary/CopyButton"
import { ShineBorder } from "@/components/ui/shine-border"

export interface StrapiHeroHomeCodeCtaProps {
  readonly code: string
}

export function StrapiHeroHomeCodeCta({ code }: StrapiHeroHomeCodeCtaProps) {
  return (
    <div className="relative grow overflow-hidden rounded-2xl">
      <div className="gradient-hero-code-overlay border-strapi-gray-700/20 absolute z-5 h-full w-full rounded-2xl border opacity-45" />
      <div className="bg-dot-grid relative z-10 overflow-hidden rounded-2xl">
        <ShineBorder
          shineColor={[
            "var(--color-hero-shine-1)",
            "var(--color-hero-shine-2)",
            "var(--color-hero-shine-3)",
            "var(--color-hero-shine-4)",
          ]}
        />
        <div className="relative z-10 flex items-center justify-between px-4 py-3.5">
          <p className="text-lg text-white">{code}</p>

          <CopyButton
            copyContent={code}
            copyLabel="Copy code"
            copiedLabel="Code copied"
            className="text-strapi-purple-500 p-2"
            iconClassName="size-5"
          />
        </div>
      </div>
    </div>
  )
}
