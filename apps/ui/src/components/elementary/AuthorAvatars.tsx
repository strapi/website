import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { cn } from "@/lib/styles"

export interface AuthorAvatarData {
  readonly id: Data.ID
  readonly username?: string | null
  readonly slug?: string | null
  readonly avatar?: {
    image?: Data.Component<"utilities.basic-image"> | null
  } | null
}

interface AuthorAvatarsProps {
  readonly authors: readonly AuthorAvatarData[]
  readonly hideUsername?: boolean
  readonly className?: string
}

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "?"
  }

  return name.trim().charAt(0).toUpperCase()
}

export function AuthorAvatars({
  authors,
  hideUsername,
  className,
}: AuthorAvatarsProps) {
  if (authors.length === 0) {
    return null
  }

  const mainAuthor = authors[0]
  const showName = !hideUsername && authors.length === 1 && mainAuthor?.username

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("flex flex-row", authors.length > 1 && "-space-x-1.5")}
      >
        {authors.map((author) => (
          <div
            key={author.id}
            className="border-strapi-purple-600/60 relative h-[30px] w-[30px] overflow-hidden rounded-full border"
          >
            {author.avatar?.image ? (
              <StrapiBasicImage
                component={author.avatar.image}
                mode="fill"
                className="object-cover"
                decorative
                sizes="30px"
              />
            ) : (
              <div className="bg-strapi-purple-900 flex h-full w-full items-center justify-center text-[11px] font-semibold text-white">
                {getInitials(author.username)}
              </div>
            )}
          </div>
        ))}
      </div>

      {showName && (
        <span className="text-strapi-purple-400 text-sm font-semibold">
          {mainAuthor?.username}
        </span>
      )}
    </div>
  )
}
