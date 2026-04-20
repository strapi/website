import type { Icon } from "@phosphor-icons/react"
import {
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { cn } from "@/lib/styles"

interface BlogSocialShareProps {
  readonly url: string
  readonly title: string
  readonly variant?: "sticky" | "row"
  readonly className?: string
}

export function BlogSocialShare({
  url,
  title,
  variant = "row",
  className,
}: BlogSocialShareProps) {
  const t = useTranslations("blog.share")

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const networks: {
    key: string
    label: string
    href: string
    icon: Icon
  }[] = useMemo(
    () => [
      {
        key: "facebook",
        label: t("facebook"),
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        icon: FacebookLogoIcon,
      },
      {
        key: "linkedin",
        label: t("linkedin"),
        href: `https://www.linkedin.com/shareArticle?url=${encodedUrl}&title=${encodedTitle}`,
        icon: LinkedinLogoIcon,
      },
      {
        key: "twitter",
        label: t("twitter"),
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        icon: XLogoIcon,
      },
      {
        key: "email",
        label: t("email"),
        href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
        icon: EnvelopeSimpleIcon,
      },
    ],
    [encodedUrl, encodedTitle, t]
  )

  const items = networks.map(({ key, label, href, icon: Icon }) => (
    <li key={key}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className="border-strapi-blue-200 bg-strapi-blue-100 text-strapi-blue-700 hover:border-strapi-blue-400 hover:text-strapi-blue-700 animate-spring-lg flex size-[42px] items-center justify-center rounded-full border transition-colors"
      >
        <Icon className="size-3.4" weight="fill" aria-hidden="true" />
      </a>
    </li>
  ))

  if (variant === "sticky") {
    return (
      <ul
        aria-label={t("label")}
        className={cn("flex list-none flex-col gap-6", className)}
      >
        {items}
      </ul>
    )
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "border-strapi-blue-200 mt-8 flex w-full flex-wrap items-center justify-center gap-3 border-t pt-6",
        className
      )}
    >
      <ul className="flex list-none flex-row flex-wrap items-center gap-3">
        {items}
      </ul>
    </div>
  )
}
