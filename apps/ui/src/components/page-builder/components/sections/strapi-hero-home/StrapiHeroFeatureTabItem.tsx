import type { Data } from "@repo/strapi-types"
import { memo } from "react"

import { cn } from "@/lib/styles"

import { StrapiBasicImage } from "../../utilities/StrapiBasicImage"

export const HERO_AUTOPLAY_DEFAULT_DURATION_MS = 5000

export interface StrapiHeroFeatureTabItemProps extends React.ComponentProps<"button"> {
  readonly active?: boolean
  readonly animationKey?: number
  readonly autoplayDuration?: number
  readonly feature: Data.Component<"elements.hero-home-feature">
  readonly onProgressComplete?: () => void
  readonly paused?: boolean
}

export const StrapiHeroFeatureTabItem = memo(
  ({
    active,
    animationKey,
    autoplayDuration = HERO_AUTOPLAY_DEFAULT_DURATION_MS,
    feature,
    id,
    onProgressComplete,
    paused,
    ...restProps
  }: StrapiHeroFeatureTabItemProps) => (
    <button
      id={id}
      type="button"
      role="tab"
      tabIndex={active ? 0 : -1}
      className={cn(
        "group relative hidden grow items-center justify-center overflow-hidden px-2 py-5 text-center lg:block",
        active && "bg-strapi-gray-900 block"
      )}
      {...restProps}
    >
      <div
        key={active ? `${animationKey}-${autoplayDuration}` : undefined}
        className="gradient-hero-progress absolute inset-x-0 bottom-0 h-px"
        style={{
          ...(active && autoplayDuration > 0
            ? {
                animation: `feature-progress ${autoplayDuration}ms linear forwards`,
                animationPlayState: paused ? "paused" : "running",
              }
            : { animation: "none", width: "0%" }),
        }}
        onAnimationEnd={
          active && autoplayDuration > 0 ? onProgressComplete : undefined
        }
      />
      <div className="flex items-center justify-center gap-1.5">
        {feature.icon ? (
          <span
            className={cn(
              "relative size-4 shrink-0 opacity-100 transition-opacity group-hover:opacity-100",
              !active && "opacity-50"
            )}
          >
            <StrapiBasicImage
              component={feature.icon}
              mode="fill"
              sizes="16px"
              decorative
            />
          </span>
        ) : null}

        <span
          className={cn(
            "text-base font-medium text-white opacity-100 transition-opacity group-hover:opacity-100",
            !active && "opacity-50"
          )}
        >
          {feature.title}
        </span>
      </div>
    </button>
  )
)
