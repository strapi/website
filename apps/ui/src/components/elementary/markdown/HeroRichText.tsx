import "server-only"

import { isSafeHref, Markdown } from "@/components/elementary/markdown/Markdown"
import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

interface HeroRichTextProps {
  children?: string | null
  className?: string
}

/**
 * Rich text renderer for hero descriptions.
 *
 * Unlike InlineMarkdown (inline content only), this renders block content —
 * paragraphs / new lines, ordered + unordered lists, and images — by building
 * on the shared Markdown component, re-themed for the heroes' dark surface
 * (muted body text, white emphasis/links).
 *
 * New lines: blank lines between text become separate paragraphs. Single
 * soft line breaks collapse to a space (standard markdown); supporting those
 * would require adding the `remark-breaks` plugin.
 */
export function HeroRichText({ children, className }: HeroRichTextProps) {
  if (!children) {
    return null
  }

  return (
    <Markdown
      className={cn(
        "text-background/60 text-sm leading-relaxed sm:text-base",
        className
      )}
      components={{
        h1: ({ children }) => (
          <Typography tag="h1" className="text-strapi-blue-600 mb-3">
            {children}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography tag="h2" className="text-strapi-blue-600 mb-3">
            {children}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography tag="h3" className="text-strapi-blue-600 mb-2">
            {children}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography tag="h4" className="text-strapi-blue-600 mb-2">
            {children}
          </Typography>
        ),
        h5: ({ children }) => (
          <Typography tag="h5" className="text-strapi-blue-600 mb-2">
            {children}
          </Typography>
        ),
        h6: ({ children }) => (
          <Typography tag="h6" className="text-strapi-blue-600 mb-2">
            {children}
          </Typography>
        ),
        p: ({ children }) => (
          <Typography tag="p" className="text-background/60 mb-3 last:mb-0">
            {children}
          </Typography>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-3 list-outside list-disc space-y-1 pl-5 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-outside list-decimal space-y-1 pl-5 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-background/60">{children}</li>
        ),
        a: ({ href, children }) => {
          const safeHref = isSafeHref(href) ? href : undefined
          const isExternal =
            safeHref?.startsWith("http://") || safeHref?.startsWith("https://")

          return (
            <a
              href={safeHref}
              className="text-white underline"
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          )
        },
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typeof src === "string" ? src : undefined}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            className="rounded-strapi-lg my-3 h-auto max-w-full"
          />
        ),
      }}
    >
      {children}
    </Markdown>
  )
}
