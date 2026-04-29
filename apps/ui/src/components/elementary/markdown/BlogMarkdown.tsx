import "server-only"

import type { Components } from "react-markdown"

import { headingId } from "@/lib/markdown-utils"

import {
  isSafeHref,
  Markdown,
  MarkdownParagraph,
  MarkdownPre,
} from "./Markdown"

const blogComponents: Partial<Components> = {
  h1: ({ children }) => (
    <h1 className="text-foreground mt-12 mb-6 scroll-mt-24 text-3xl leading-tight font-bold tracking-tight sm:mt-18 sm:mb-8 sm:text-4xl">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2
      id={headingId(children)}
      className="text-foreground mt-12 mb-5 scroll-mt-24 text-2xl leading-tight font-bold tracking-tight sm:mt-17 sm:mb-7 sm:text-3xl"
    >
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3
      id={headingId(children)}
      className="text-foreground mb-6 scroll-mt-24 text-xl leading-tight font-bold tracking-tight sm:mb-8 sm:text-2xl"
    >
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="text-foreground mb-6 text-lg leading-tight font-bold tracking-tight sm:mb-8 sm:text-xl">
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
    <MarkdownParagraph className="text-foreground mb-8 text-base leading-relaxed lg:text-xl">
      {children}
    </MarkdownParagraph>
  ),

  a: ({ href, children }) => {
    const safeHref = isSafeHref(href) ? href : undefined
    const isExternal =
      safeHref?.startsWith("http://") || safeHref?.startsWith("https://")

    return (
      <a
        href={safeHref}
        className="*:text-strapi-purple-600 text-strapi-purple-600 bg-strapi-purple-100 hover:*:text-strapi-purple-700 hover:text-strapi-purple-700 transition-colors *:transition-colors"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    )
  },

  ul: ({ children }) => (
    <ul className="mb-8 list-outside list-disc space-y-1 pl-6">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-8 list-outside list-decimal space-y-1 pl-6">
      {children}
    </ol>
  ),

  li: ({ children }) => <li className="text-strapi-body-1">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="border-strapi-purple-300 text-muted-foreground mb-8 border-l-4 pl-4 italic">
      {children}
    </blockquote>
  ),

  pre: ({ node, children }) => (
    <MarkdownPre
      node={node}
      className="bg-muted mb-8 overflow-x-auto rounded-lg p-4 font-mono text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0"
    >
      {children}
    </MarkdownPre>
  ),

  table: ({ children }) => (
    <div className="mb-8 w-full overflow-x-auto">
      <table className="border-strapi-neutral-500 text-strapi-small-1 w-full border-collapse border">
        {children}
      </table>
    </div>
  ),
}

type BlogMarkdownProps = {
  children?: string | null
  className?: string
}

export function BlogMarkdown({ children, className }: BlogMarkdownProps) {
  return (
    <Markdown className={className} components={blogComponents}>
      {children}
    </Markdown>
  )
}
