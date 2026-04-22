import { type BlogPost, getBlogPostPublishDate } from "@/lib/blog-utils"
import { formatStrapiMediaUrl } from "@/lib/strapi-helpers"

interface BuildBlogPostingArgs {
  readonly post: BlogPost
  readonly url: string
  readonly siteUrl?: string
  readonly siteName?: string
}

type JsonLdAuthor =
  | { "@type": "Person"; name: string }
  | { "@type": "Organization"; name: string }

function fullName(user: {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

  return name || user.username || null
}

export function buildBlogPostingJsonLd({
  post,
  url,
  siteUrl,
  siteName,
}: BuildBlogPostingArgs) {
  const primary = post.author ? fullName(post.author) : null
  const coauthorNames = (post.coauthors ?? [])
    .map((u) => (u ? fullName(u) : null))
    .filter((name): name is string => typeof name === "string")

  const authors: JsonLdAuthor[] = [
    ...(primary ? [{ "@type": "Person" as const, name: primary }] : []),
    ...coauthorNames.map((name) => ({ "@type": "Person" as const, name })),
  ]

  const datePublished = getBlogPostPublishDate(post)

  const rawImageUrl = post.image?.image?.media?.url ?? undefined
  const imageBase = siteUrl ?? url
  const imageUrl = rawImageUrl
    ? new URL(
        formatStrapiMediaUrl(rawImageUrl) ?? rawImageUrl,
        imageBase
      ).toString()
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title,
    description: post.description ?? undefined,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: datePublished ?? undefined,
    dateModified: post.updatedAt ?? datePublished ?? undefined,
    author: authors.length > 0 ? authors : undefined,
    publisher: siteName
      ? { "@type": "Organization", name: siteName }
      : undefined,
    articleSection: post.category?.name ?? undefined,
    keywords: post.tags?.map((t) => t.name).join(", ") || undefined,
  } as const
}
