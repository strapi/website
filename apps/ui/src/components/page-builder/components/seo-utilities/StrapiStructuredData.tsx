export function StrapiStructuredData({
  structuredData,
  id = "strapiStructuredData",
}: {
  // Accepts both Strapi's `shared.seo.structuredData` JSON field and locally
  // built JSON-LD graphs (Organization/WebSite/WebPage) — both are serialized
  // verbatim, so an opaque value is the right contract here.
  structuredData?: unknown
  id?: string
}) {
  if (structuredData) {
    // we need to use a plain `script` tag instead of the `Script` component
    // `Script` component is optimized by Next, which works against us in this case
    // - if id is specified, the content will not be updated on client navigation
    // - if no id is specified, a new script tag will be added with the new content, which schema validators are not able to parse.
    // `script` tag is properly re-rendered and replaced with the new content
    return (
      <script id={id} type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    )
  }

  return null
}
