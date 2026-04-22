import type { Locale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { type BlogPost, getBlogPostPublishDate } from "@/lib/blog-utils"
import { getEnvVar } from "@/lib/env-vars"
import { routing } from "@/lib/navigation"
import { fetchBlogPostsList } from "@/lib/strapi-api/content/server"
import { formatStrapiMediaUrl } from "@/lib/strapi-helpers"

type RssPost = BlogPost & {
  image?: {
    image?: { media?: { url?: string | null } | null } | null
  } | null
  category?: { name?: string | null } | null
}

export const revalidate = 3600

function escapeXml(value: string | null | undefined): string {
  if (!value) return ""

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function escapeCdata(value: string): string {
  return value.replaceAll("]]>", "]]]]><![CDATA[>")
}

function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl).toString()
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: localeParam } = await params
  const locale = localeParam as Locale
  const siteUrl = getEnvVar("APP_PUBLIC_URL")

  if (!siteUrl) {
    return new Response("Site URL not configured", { status: 500 })
  }

  const t = await getTranslations({
    locale: locale as "en",
    namespace: "blog",
  })
  const posts = await fetchBlogPostsList(locale)
  const items = (posts?.data ?? []) as RssPost[]

  const localePath = routing.defaultLocale !== locale ? `/${locale}` : ""
  const blogUrl = absoluteUrl(siteUrl, `${localePath}/blog`)
  const feedUrl = absoluteUrl(siteUrl, `${localePath}/blog/rss.xml`)

  const rssItems = items
    .map((post) => {
      const postUrl = absoluteUrl(siteUrl, `${localePath}/blog/${post.slug}`)
      const rawImage = post.image?.image?.media?.url
      const imageHtml = rawImage
        ? `<p><img src="${escapeXml(
            absoluteUrl(siteUrl, formatStrapiMediaUrl(rawImage) ?? rawImage)
          )}" /></p>`
        : ""
      const description = post.description ?? ""
      const resolvedPublishDate = getBlogPostPublishDate(post)
      const pubDate = resolvedPublishDate
        ? new Date(resolvedPublishDate).toUTCString()
        : new Date().toUTCString()
      const categoryTag = post.category?.name
        ? `<category>${escapeXml(post.category.name)}</category>`
        : ""

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${categoryTag}
      <description><![CDATA[${escapeCdata(imageHtml + description)}]]></description>
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(t("title"))}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(t("description"))}</description>
    <language>${locale}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${rssItems}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
