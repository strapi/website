import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

interface InlineMarkdownProps {
  children?: string | null
  inline?: boolean
  className?: string
}

const INLINE_ELEMENTS = ["p", "strong", "em", "del", "u", "a", "code", "br"]
const BLOCK_ELEMENTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
]

/**
 * Markdown renderer that inherits the parent's typography — font size and text
 * colors are never overridden, so callers control them via `className` on the
 * wrapping element. The lightweight, client-safe counterpart to `Markdown`.
 *
 * Supports Strapi's rich text formatting:
 *   **bold**, _italic_, ~~strikethrough~~, <u>underline</u>,
 *   [links](url), `inline code`, soft line breaks
 *
 * By default it also renders block content — lists and blockquotes — wrapped in
 * a <div> so the markup stays valid. Pass `inline` to strip blocks and render
 * inline formatting only, in a <span> that flows with the surrounding text
 * (use it where blocks would break the layout, e.g. single-line / truncated).
 *
 * Used in places like TooltipContent, SectionDescription.
 */
export function InlineMarkdown({
  children,
  inline,
  className,
}: InlineMarkdownProps) {
  if (!children) {
    return null
  }

  const allowedElements = inline
    ? INLINE_ELEMENTS
    : [...INLINE_ELEMENTS, ...BLOCK_ELEMENTS]

  // Block content is wrapped in a <div> (valid markup + `space-y` rhythm
  // between paragraphs/lists); inline-only content stays in a <span> so it
  // flows with the surrounding text.
  const Wrapper = inline ? "span" : "div"

  return (
    <Wrapper
      data-slot="inline-markdown"
      className={cn(!inline && "space-y-3", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        allowedElements={allowedElements}
        unwrapDisallowed
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
          p: ({ children }) => (inline ? <>{children}</> : <p>{children}</p>),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through">{children}</del>,
          u: ({ children }) => <u className="underline">{children}</u>,
          a: ({ href, children }) => {
            const isExternal =
              href?.startsWith("http://") || href?.startsWith("https://")

            return (
              <a
                href={href}
                className="underline"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            )
          },
          code: ({ children }) => (
            <code className="rounded-strapi-sm border-border border px-1 py-0.5 font-mono text-sm">
              {children}
            </code>
          ),
          ul: ({ children }) => (
            <ul className="list-outside list-disc space-y-1 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-outside list-decimal space-y-1 pl-5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-current/20 pl-4 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </Wrapper>
  )
}
