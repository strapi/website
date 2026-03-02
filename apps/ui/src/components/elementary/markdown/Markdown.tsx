import "server-only"

import ReactMarkdown, { type Components } from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

import { Typography } from "@/components/typography"
import { cn } from "@/lib/styles"

type MarkdownProps = {
  children?: string | null
  className?: string
}

const components: Components = {
  h1: ({ children }) => (
    <Typography tag="h1" textColor="foreground" className="mb-4">
      {children}
    </Typography>
  ),

  h2: ({ children }) => (
    <Typography tag="h2" textColor="foreground" className="mb-3">
      {children}
    </Typography>
  ),

  h3: ({ children }) => (
    <Typography tag="h3" textColor="foreground" className="mb-3">
      {children}
    </Typography>
  ),

  h4: ({ children }) => (
    <Typography tag="h4" textColor="foreground" className="mb-2">
      {children}
    </Typography>
  ),

  h5: ({ children }) => (
    <Typography tag="h5" textColor="foreground" className="mb-2">
      {children}
    </Typography>
  ),

  h6: ({ children }) => (
    <Typography tag="h6" textColor="foreground" className="mb-2">
      {children}
    </Typography>
  ),

  p: ({ children }) => (
    <p className="text-strapi-body-1 text-muted-foreground mb-4 leading-relaxed">
      {children}
    </p>
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
        className="text-primary underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    )
  },

  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
  ),

  li: ({ children }) => (
    <li className="text-strapi-body-1 text-muted-foreground">{children}</li>
  ),

  blockquote: ({ children }) => (
    <blockquote className="border-strapi-purple-300 text-muted-foreground mb-4 border-l-4 pl-4 italic">
      {children}
    </blockquote>
  ),

  code: ({ children }) => (
    <code className="bg-muted border-border rounded border px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),

  pre: ({ children }) => (
    <pre className="bg-muted mb-4 overflow-x-auto rounded-lg p-4 font-mono text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),

  table: ({ children }) => (
    <div className="mb-4 w-full overflow-x-auto">
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
  if (!children) return null

  return (
    <div data-slot="markdown" className={cn(className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
