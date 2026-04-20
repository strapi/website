import { loadEnv } from "../config/env.ts"

const slugs = [
  "5-reasons-to-add-on-site-search-to-your-website",
  "working-remotely-from-a-different-time-zone-during-one-month",
  "how-to-create-a-job-board-website-with-react-and-strapi",
]

const env = loadEnv()

function check(label: string, passed: boolean, detail?: string) {
  const icon = passed ? "✓" : "✗"
  console.log(`    ${icon} ${label}${detail ? ` — ${detail}` : ""}`)

  return passed
}

for (const slug of slugs) {
  console.log(`\n═══ ${slug} ═══`)

  const targetUrl =
    `${env.target.baseUrl}/api/blog-posts?filters[slug][$eq]=${slug}` +
    `&status=draft` +
    `&populate[seo][populate][metaImage]=true` +
    `&populate[seo][populate][og][populate][image]=true` +
    `&populate[seo][populate][twitter][populate][images]=true` +
    `&populate[category][fields][0]=name` +
    `&populate[category][fields][1]=slug` +
    `&populate[category][populate][parent][fields][0]=name` +
    `&populate[author][fields][0]=username` +
    `&populate[coauthors][fields][0]=username` +
    `&populate[tags][fields][0]=name` +
    `&populate[tags][fields][1]=slug` +
    `&populate[image][populate][image]=true` +
    `&populate[sections][on][blog.related-posts][populate][blogPosts][fields][0]=slug`
  const targetRes = await fetch(targetUrl, {
    headers: { Authorization: `Bearer ${env.target.token}` },
  })
  const targetJson = (await targetRes.json()) as {
    data: Record<string, unknown>[]
  }
  const t = targetJson.data?.[0]

  if (!t) {
    console.log("  [target missing]")
    continue
  }

  // Fetch source v4 for comparison
  const srcUrl =
    `${env.source.baseUrl}/api/blog-posts?filters[slug][$eq]=${slug}` +
    `&populate[seo][populate][metaImage]=true` +
    `&populate[seo][populate][metaSocial][populate][image]=true` +
    `&populate[featuredCategory]=*` +
    `&populate[postSubCategory]=*` +
    `&populate[tags]=*` +
    `&populate[user]=*` +
    `&populate[coauthors]=*`
  const srcRes = await fetch(srcUrl, {
    headers: { Authorization: `Bearer ${env.source.token}` },
  })
  const srcJson = (await srcRes.json()) as {
    data: { id: number; attributes: Record<string, unknown> }[]
  }
  const s = srcJson.data?.[0]?.attributes ?? {}
  const sSeo = (s["seo"] ?? {}) as Record<string, unknown>
  const sSocial = (sSeo["metaSocial"] ?? []) as Record<string, unknown>[]

  const tSeo = (t["seo"] ?? {}) as Record<string, unknown>
  const tOg = (tSeo["og"] ?? {}) as Record<string, unknown>
  const tTwitter = (tSeo["twitter"] ?? {}) as Record<string, unknown>

  // Core copy fields
  check("title copied", t["title"] === s["title"])
  check(
    "description copied",
    (t["description"] ?? null) === (s["description"] ?? null),
    `target="${t["description"] ?? ""}"`
  )
  check(
    "version copied",
    (t["version"] ?? null) === (s["version"] ?? null),
    `target=${t["version"] ?? "null"}`
  )
  check("level copied", (t["level"] ?? null) === (s["level"] ?? null))

  // Category hierarchy: postSubCategory → category when present
  const srcSub = (
    s["postSubCategory"] as { data?: { attributes?: { slug?: string } } }
  )?.data?.attributes?.slug
  const srcFeat = (
    s["featuredCategory"] as { data?: { attributes?: { slug?: string } } }
  )?.data?.attributes?.slug
  const tgtCat = (t["category"] as { slug?: string })?.slug
  const tgtParent = (t["category"] as { parent?: { name?: string } })?.parent
    ?.name
  const expectedCatSlug = srcSub ?? srcFeat
  check(
    "category resolved",
    tgtCat === expectedCatSlug,
    `expected=${expectedCatSlug ?? "null"} got=${tgtCat ?? "null"}${tgtParent ? ` (parent=${tgtParent})` : ""}`
  )

  // Author
  const srcAuthor = (
    s["user"] as { data?: { attributes?: { username?: string } } }
  )?.data?.attributes?.username
  const tgtAuthor = (t["author"] as { username?: string })?.username
  check(
    "author resolved",
    (tgtAuthor ?? null) === (srcAuthor ?? null),
    `expected=${srcAuthor ?? "null"} got=${tgtAuthor ?? "null"}`
  )

  // Tags
  const srcTagSlugs = (
    (s["tags"] as { data?: { attributes?: { slug?: string } }[] })?.data ?? []
  )
    .map((tg) => tg.attributes?.slug)
    .filter(Boolean)
  const tgtTagSlugs = ((t["tags"] as { slug?: string }[]) ?? [])
    .map((tg) => tg.slug)
    .filter(Boolean)
  const tagsMatch =
    srcTagSlugs.length === tgtTagSlugs.length &&
    srcTagSlugs.every((sl) => tgtTagSlugs.includes(sl as string))
  check(
    "tags match",
    tagsMatch,
    `src=[${srcTagSlugs.join(",")}] tgt=[${tgtTagSlugs.join(",")}]`
  )

  // SEO
  check(
    "seo.metaTitle populated",
    typeof tSeo["metaTitle"] === "string" &&
      (tSeo["metaTitle"] as string).length > 0,
    `"${tSeo["metaTitle"]}"`
  )
  check(
    "seo.metaDescription populated",
    typeof tSeo["metaDescription"] === "string" &&
      (tSeo["metaDescription"] as string).length > 0
  )
  check(
    "seo.og.type === 'article'",
    tOg["type"] === "article",
    `got "${tOg["type"]}"`
  )
  check("seo.og.siteName === 'Strapi'", tOg["siteName"] === "Strapi")

  // Check OG/Twitter derivation from metaSocial
  const fbSrc = sSocial.find(
    (e) =>
      (e["socialNetwork"] as string | undefined)?.toLowerCase() === "facebook"
  )
  const twSrc = sSocial.find(
    (e) =>
      (e["socialNetwork"] as string | undefined)?.toLowerCase() === "twitter"
  )

  if (fbSrc) {
    check(
      "og.title from fb metaSocial",
      tOg["title"] === fbSrc["title"] || tOg["title"] === tSeo["metaTitle"],
      `og.title="${tOg["title"]}" fb="${fbSrc["title"]}"`
    )
  }
  if (twSrc) {
    check(
      "twitter.title from tw metaSocial",
      tTwitter["title"] === twSrc["title"] ||
        tTwitter["title"] === tSeo["metaTitle"]
    )
  }

  // Related-posts pass-2
  const sections = (t["sections"] as Record<string, unknown>[]) ?? []
  const relatedCount = sections.filter(
    (sec) => sec["__component"] === "blog.related-posts"
  ).length
  const dataSinkCount = sections.filter(
    (sec) => sec["__component"] === "migration.data-sink"
  ).length
  console.log(
    `    · sections: ${sections.length} total, ${relatedCount} related-posts, ${dataSinkCount} data-sinks`
  )
}
