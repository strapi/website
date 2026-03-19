import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

interface InlineMarkdownProps {
  children?: string | null
  className?: string
}

/**
 * Lightweight markdown renderer for inline content only.
 *
 * Supports Strapi's rich text formatting:
 *   **bold**, _italic_, ~~strikethrough~~, <u>underline</u>,
 *   [links](url), `inline code`
 * Strips block elements (headings, lists, blockquotes, code blocks, etc.).
 *
 * All text colors inherit from the parent — no overrides.
 * Safe for client components (no "server-only").
 *
 * Used in places like TooltipContent, SectionDescription
 */
export function InlineMarkdown({ children, className }: InlineMarkdownProps) {
  if (!children) {
    return null
  }

  return (
    <span data-slot="inline-markdown" className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        allowedElements={["p", "strong", "em", "del", "u", "a", "code", "br"]}
        unwrapDisallowed
        components={{
          p: ({ children }) => <p>{children}</p>,
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
        }}
      >
        {children}
      </ReactMarkdown>
    </span>
  )
}
