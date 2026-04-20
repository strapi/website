"use client"

import {
  CheckIcon,
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  type Icon,
  LinkIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { useClip } from "@/hooks/useClip"
import { cn } from "@/lib/styles"

interface BlogSocialShareProps {
  readonly url: string
  readonly title: string
  readonly className?: string
}

export function BlogSocialShare({
  url,
  title,
  className,
}: BlogSocialShareProps) {
  const t = useTranslations("blog.share")
  const { copy, copied } = useClip({ resetDelayMs: 2000 })

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const buttons: {
    key: string
    label: string
    href?: string
    onClick?: () => void
    icon: Icon
    active?: boolean
  }[] = [
    {
      key: "twitter",
      label: t("twitter"),
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XLogoIcon,
    },
    {
      key: "linkedin",
      label: t("linkedin"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: LinkedinLogoIcon,
    },
    {
      key: "facebook",
      label: t("facebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: FacebookLogoIcon,
    },
    {
      key: "email",
      label: t("email"),
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: EnvelopeSimpleIcon,
    },
    {
      key: "copy",
      label: copied ? t("copied") : t("copyLink"),
      onClick: () => {
        void copy(url)
      },
      icon: copied ? CheckIcon : LinkIcon,
      active: copied,
    },
  ]

  return (
    <div
      className={cn(
        "border-strapi-gray-700/50 mt-8 flex flex-wrap items-center gap-3 border-t pt-6",
        className
      )}
    >
      <span className="text-strapi-gray-400 mr-2 text-sm font-medium">
        {t("label")}
      </span>

      {buttons.map(({ key, label, href, onClick, icon: Icon, active }) => {
        const sharedClass = cn(
          "border-strapi-gray-700/50 hover:border-strapi-gray-400/60 hover:text-strapi-gray-100 text-strapi-gray-300 rounded-strapi-sm flex size-9 items-center justify-center border transition-colors",
          active && "border-strapi-green-500/50 text-strapi-green-400"
        )

        if (onClick) {
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              title={label}
              onClick={onClick}
              className={sharedClass}
            >
              <Icon className="size-4" weight="bold" />
            </button>
          )
        }

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={sharedClass}
          >
            <Icon className="size-4" weight="bold" />
          </a>
        )
      })}
    </div>
  )
}
