import { notFound } from "next/navigation"
import type { Locale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { use } from "react"

import { Container } from "@/components/elementary/Container"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { fetchBlogPost } from "@/lib/strapi-api/content/server"

interface Props {
  params: {
    locale: string
    slug: string
  }
}

export function StrapiBlogPostView({ params }: Props) {
  const locale = params.locale as Locale
  const slug = params.slug as string

  setRequestLocale(locale)

  const response = use(fetchBlogPost(slug, locale))

  const data = response?.data
  if (!data) {
    notFound()
  }

  // Cast to access populated relations and dynamic zone (not in strict types)
  const postData = data as Record<string, unknown>
  const sections = postData.sections as
    | { __component: string; id: number; [key: string]: unknown }[]
    | undefined
  const content = data.content

  return (
    <div className="flex w-full flex-col">
      <main className="flex w-full flex-col">
        {/* Temporary: render blog content as JSON to verify data fetching works */}
        <section className="py-8 lg:py-16">
          <Container>
            <pre className="bg-strapi-neutral-100 overflow-auto rounded-lg p-6 text-sm">
              {JSON.stringify(
                {
                  title: data.title,
                  slug: data.slug,
                  description: data.description,
                  level: postData.level,
                  author: postData.author,
                  category: postData.category,
                  tags: postData.tags,
                  contentLength:
                    typeof content === "string" ? content.length : 0,
                  contentPreview:
                    typeof content === "string" ? content.slice(0, 500) : null,
                },
                null,
                2
              )}
            </pre>
          </Container>
        </section>

        {/* Dynamic sections below the blog content */}
        {sections && sections.length > 0 && (
          <DynamicZoneRenderer
            content={sections}
            itemClassName="mb-6 md:mb-10 lg:mb-14"
            surface="page"
          />
        )}
      </main>
    </div>
  )
}
