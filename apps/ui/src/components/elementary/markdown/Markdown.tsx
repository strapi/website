import "server-only"

import ReactMarkdown, { type Components } from "react-markdown"

import { cn } from "@/lib/styles"

import { SectionHeading } from "../SectionHeading"

type MarkdownProps = {
  children?: string | null
  className?: string
}

const components: Components = {
  h1: ({ children }) => (
    <SectionHeading as="h1" textStyle="h1" className="mb-4">
      {children}
    </SectionHeading>
  ),

  h2: ({ children }) => (
    <SectionHeading as="h2" textStyle="h2" className="mb-3">
      {children}
    </SectionHeading>
  ),

  h3: ({ children }) => (
    <SectionHeading as="h3" textStyle="h3" className="mb-3">
      {children}
    </SectionHeading>
  ),

  h4: ({ children }) => (
    <SectionHeading as="h4" textStyle="subtitle1" className="mb-2">
      {children}
    </SectionHeading>
  ),

  h5: ({ children }) => (
    <SectionHeading as="h5" textStyle="subtitle2" className="mb-2">
      {children}
    </SectionHeading>
  ),

  h6: ({ children }) => (
    <SectionHeading as="h6" textStyle="subtitle2" className="mb-2">
      {children}
    </SectionHeading>
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
    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">
      {children}
    </code>
  ),

  pre: ({ children }) => (
    <pre className="bg-muted mb-4 overflow-x-auto rounded-lg p-4 font-mono text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
}

export function Markdown({ children, className }: MarkdownProps) {
  if (!children) return null

  return (
    <div data-slot="markdown" className={cn(className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
