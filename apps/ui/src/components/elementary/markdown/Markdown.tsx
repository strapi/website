import "server-only"

import ReactMarkdown, { type Components } from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

import { headingId } from "@/lib/markdown-utils"
import { cn } from "@/lib/styles"

type MarkdownProps = {
  children?: string | null
  className?: string
}

const remarkPlugins = [remarkGfm]
const rehypePlugins = [rehypeRaw]

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-foreground mt-18 mb-8 scroll-mt-24 text-4xl leading-tight font-bold tracking-tight">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2
      id={headingId(children)}
      className="text-foreground mt-17 mb-7 scroll-mt-24 text-3xl leading-tight font-bold tracking-tight"
    >
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3
      id={headingId(children)}
      className="text-foreground mb-8 scroll-mt-24 text-2xl leading-tight font-bold tracking-tight"
    >
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="text-foreground mb-8 text-xl leading-tight font-bold tracking-tight">
      {children}
    </h4>
  ),

  h5: ({ children }) => (
    <h5 className="text-foreground mb-6 text-lg leading-tight font-bold tracking-tight">
      {children}
    </h5>
  ),

  h6: ({ children }) => (
    <h6 className="text-foreground mb-4 text-base leading-tight font-bold tracking-tight">
      {children}
    </h6>
  ),

  p: ({ children }) => (
    <p className="text-foreground mb-8 text-xl leading-relaxed">{children}</p>
  ),

  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
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
        className="*:text-strapi-purple-600 text-strapi-purple-600 bg-strapi-purple-100 hover:*:text-strapi-purple-700 hover:text-strapi-purple-700 transition-colors *:transition-colors"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    )
  },

  ul: ({ children }) => (
    <ul className="mb-8 list-disc space-y-1 pl-6">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-8 list-decimal space-y-1 pl-6">{children}</ol>
  ),

  li: ({ children }) => <li className="text-strapi-body-1">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="border-strapi-purple-300 text-muted-foreground mb-8 border-l-4 pl-4 italic">
      {children}
    </blockquote>
  ),

  code: ({ children }) => (
    <code className="bg-muted border-border rounded border px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),

  pre: ({ children }) => (
    <pre className="bg-muted mb-8 overflow-x-auto rounded-lg p-4 font-mono text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),

  table: ({ children }) => (
    <div className="mb-8 w-full overflow-x-auto">
      <table className="border-strapi-neutral-500 text-strapi-small-1 w-full border-collapse border">
        {children}
      </table>
    </div>
  ),

  th: ({ children }) => (
    <th className="border-strapi-border bg-strapi-blue-100 border px-6 py-4 text-center align-middle font-normal">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="border-strapi-border border px-6 py-4 align-middle">
      {children}
    </td>
  ),
}

export function Markdown({ children, className }: MarkdownProps) {
  if (!children) {
    return null
  }

  return (
    <div data-slot="markdown" className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
