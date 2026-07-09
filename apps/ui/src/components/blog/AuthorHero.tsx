import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"

import { AuthorSocialLinks } from "./AuthorSocialLinks"

export interface AuthorHeroData {
  readonly username?: string | null
  readonly job?: string | null
  readonly description?: string | null
  readonly avatar?: {
    image?: Data.Component<"utilities.basic-image"> | null
  } | null
  readonly socials?: Data.Component<"utilities.social-link">[] | null
}

interface AuthorHeroProps {
  readonly author: AuthorHeroData
}

export function AuthorHero({ author }: AuthorHeroProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative size-[104px] overflow-hidden rounded-full shadow-lg ring-2 ring-white/90">
        {author.avatar?.image ? (
          <StrapiBasicImage
            component={author.avatar.image}
            mode="fill"
            className="object-cover"
            sizes="104px"
            decorative
          />
        ) : (
          <div className="bg-strapi-purple-900 flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
            {author.username?.trim().charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {author.username}
      </h1>

      {author.job && (
        <p className="text-strapi-purple-400 text-sm font-medium">
          {author.job}
        </p>
      )}

      <AuthorSocialLinks links={author.socials} />

      {author.description && (
        <p className="text-strapi-gray-400 max-w-2xl text-base">
          {author.description}
        </p>
      )}
    </div>
  )
}
