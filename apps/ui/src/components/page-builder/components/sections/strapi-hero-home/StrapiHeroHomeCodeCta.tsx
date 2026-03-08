"use client"

import { CopyButton } from "@/components/elementary/CopyButton"
import { ShineBorder } from "@/components/ui/shine-border"

export interface StrapiHeroHomeCodeCtaProps {
  readonly code: string
}

export function StrapiHeroHomeCodeCta({ code }: StrapiHeroHomeCodeCtaProps) {
  return (
    <div className="relative grow overflow-hidden rounded-2xl">
      <div className="border-strapi-gray-700/20 absolute z-5 h-full w-full rounded-2xl border bg-[linear-gradient(165deg,#030712_0%,#4845F600_33%,#4845F6_65%,#A15BED_100%)] opacity-45" />
      <div className="bg-dot-grid relative z-10 overflow-hidden rounded-2xl">
        <ShineBorder
          shineColor={[
            "rgba(198, 208, 255, 0.8)",
            "rgba(136, 141, 255, 0.74)",
            "rgba(95, 95, 255, 0.82)",
            "rgba(194, 112, 255, 0.88)",
          ]}
        />
        <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3.5">
          <p className="text-lg text-white">{code}</p>

          <CopyButton
            copyContent={code}
            copyLabel="Copy code"
            copiedLabel="Code copied"
            className="p-2 text-[#A15BED]"
            iconClassName="size-5"
          />
        </div>
      </div>
    </div>
  )
}
