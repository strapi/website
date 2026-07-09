import type { AuthorAvatarData } from "@/components/elementary/AuthorAvatars"
import { Container } from "@/components/elementary/Container"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { Link } from "@/lib/navigation"

export interface BlogAuthor extends AuthorAvatarData {
  readonly job?: string | null
  readonly description?: string | null
}

interface BlogAuthorBannerProps {
  readonly author?: BlogAuthor | null
}

export function BlogAuthorBanner({ author }: BlogAuthorBannerProps) {
  if (!author) {
    return null
  }

  const { username, job, description, avatar, slug } = author

  const avatarImage = avatar?.image && (
    <div className="relative mb-4 size-16 shrink-0 overflow-hidden rounded-full lg:mr-7 lg:mb-0">
      <StrapiBasicImage
        component={avatar.image}
        mode="fill"
        className="object-cover"
        sizes="64px"
        decorative
      />
    </div>
  )

  return (
    <section className="my-8 lg:my-18">
      <Container>
        <div className="mx-auto max-w-210">
          <div className="bg-strapi-neutral-200 h-px" />

          <div className="flex flex-col pt-8 pb-8 lg:flex-row lg:items-center lg:pb-10">
            {avatarImage &&
              (slug ? (
                <Link href={`/user/${slug}`} aria-label={username ?? "Author"}>
                  {avatarImage}
                </Link>
              ) : (
                avatarImage
              ))}

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-col">
                {username &&
                  (slug ? (
                    <Link
                      href={`/user/${slug}`}
                      className="text-strapi-neutral-800 text-base font-medium hover:underline"
                    >
                      {username}
                    </Link>
                  ) : (
                    <span className="text-strapi-neutral-800 text-base font-medium">
                      {username}
                    </span>
                  ))}

                {job && (
                  <span className="text-strapi-purple-600 text-xs font-medium">
                    {job}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-strapi-neutral-800 text-sm">{description}</p>
              )}
            </div>
          </div>

          <div className="bg-strapi-neutral-200 h-px" />
        </div>
      </Container>
    </section>
  )
}
