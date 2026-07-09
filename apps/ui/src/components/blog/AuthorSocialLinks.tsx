import type { Icon } from "@phosphor-icons/react"
import {
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  GlobeIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import type { Data } from "@repo/strapi-types"

import { cn } from "@/lib/styles"

const PLATFORM_ICONS: Record<string, Icon> = {
  linkedin: LinkedinLogoIcon,
  twitter: XLogoIcon,
  github: GithubLogoIcon,
  email: EnvelopeSimpleIcon,
  website: GlobeIcon,
}

function getHref(platform: string, url: string) {
  if (platform === "email" && !url.startsWith("mailto:")) {
    return `mailto:${url}`
  }

  return url
}

interface AuthorSocialLinksProps {
  readonly links?: Data.Component<"utilities.social-link">[] | null
  readonly className?: string
}

/**
 * Server-safe variant of `TeamMemberSocialLinks` (no click handlers), styled
 * for the dark blog hero.
 */
export function AuthorSocialLinks({
  links,
  className,
}: AuthorSocialLinksProps) {
  if (!links?.length) return null

  return (
    <ul className={cn("flex list-none items-center gap-1", className)}>
      {links.map((link) => {
        if (!link.platform || !link.url) return null

        const PlatformIcon = PLATFORM_ICONS[link.platform]

        if (!PlatformIcon) return null

        return (
          <li key={link.id}>
            <a
              href={getHref(link.platform, link.url)}
              target={link.platform === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={link.platform}
              title={link.platform}
              className="text-strapi-gray-400 flex size-8 items-center justify-center rounded-full transition-colors hover:text-white"
            >
              <PlatformIcon
                className="size-4.5"
                weight="fill"
                aria-hidden="true"
              />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
