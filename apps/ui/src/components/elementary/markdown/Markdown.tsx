import "server-only"

import { YouTubeEmbed } from "@next/third-parties/google"
import ReactMarkdown, { type Components, type Options } from "react-markdown"
import { Tweet } from "react-tweet"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"

type PluggableList = NonNullable<Options["rehypePlugins"]>

import { CodeHighlighter } from "@/components/elementary/code-highlighter/CodeHighlighter"
import { getTweetId, getYouTubeId } from "@/lib/embed-utils"
import { headingId } from "@/lib/markdown-utils"
import { cn } from "@/lib/styles"

function extractSoleLink(
  children: React.ReactNode
): { href: string; text: string } | null {
  const nodes = Array.isArray(children) ? children : [children]
  const meaningful = nodes.filter((child) => {
    if (typeof child === "string") return child.trim() !== ""

    return child != null && child !== false
  })

  if (meaningful.length !== 1) {
    return null
  }

  const [only] = meaningful

  if (!only || typeof only !== "object" || !("props" in only)) {
    return null
  }

  const props = (only as { props?: { href?: unknown; children?: unknown } })
    .props

  const href = typeof props?.href === "string" ? props.href : null

  if (!href) {
    return null
  }

  const text =
    typeof props?.children === "string"
      ? props.children
      : Array.isArray(props?.children)
        ? props.children.join("")
        : ""

  return { href, text: typeof text === "string" ? text : "" }
}

function InlineEmbed({ url }: { url: string }) {
  const youtubeId = getYouTubeId(url)

  if (youtubeId) {
    return (
      <div className="my-9 overflow-hidden rounded-lg">
        <YouTubeEmbed videoid={youtubeId} />
      </div>
    )
  }

  const tweetId = getTweetId(url)

  if (tweetId) {
    return (
      <div className="my-9 flex justify-center [&_.react-tweet-theme]:my-0">
        <Tweet id={tweetId} />
      </div>
    )
  }

  return null
}

/**
 * Shared paragraph renderer — wraps content in a styled `<p>` but renders
 * an inline embed (YouTube / Tweet) when the paragraph is just one link
 * pointing at a supported URL. Exported so overrides can reuse the embed
 * behavior while customizing the paragraph className.
 */
export function MarkdownParagraph({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  const soleLink = extractSoleLink(children)

  if (soleLink && (getYouTubeId(soleLink.href) || getTweetId(soleLink.href))) {
    return <InlineEmbed url={soleLink.href} />
  }

  return <p className={className}>{children}</p>
}

type PreComponentProps = Parameters<
  Extract<NonNullable<Components["pre"]>, (props: never) => unknown>
>[0]
type PreNode = PreComponentProps["node"]

/**
 * Shared `<pre>` renderer — delegates to CodeHighlighter when a language
 * class is present on the inner `<code>`, otherwise falls back to a plain
 * styled `<pre>`. Exported so overrides can customize the fallback className
 * without losing the highlighter detection.
 */
export function MarkdownPre({
  node,
  children,
  className,
}: {
  node?: PreNode
  children?: React.ReactNode
  className?: string
}) {
  const codeChild = node?.children?.[0]

  if (codeChild?.type === "element" && codeChild.tagName === "code") {
    const classNames = (codeChild.properties?.className ?? []) as string[]
    const langClass = classNames.find((c) => c.startsWith("language-"))
    const language = langClass?.replace("language-", "")

    const text = codeChild.children
      ?.map((child) => (child.type === "text" ? child.value : ""))
      .join("")
      .replace(/\n$/, "")

    if (text) {
      return <CodeHighlighter code={text} language={language} />
    }
  }

  return <pre className={className}>{children}</pre>
}

type MarkdownProps = {
  children?: string | null
  className?: string
  components?: Partial<Components>
}

const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-./],
    ],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      ["className", /^language-./],
    ],
    h1: [...(defaultSchema.attributes?.h1 ?? []), "id"],
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    h5: [...(defaultSchema.attributes?.h5 ?? []), "id"],
    h6: [...(defaultSchema.attributes?.h6 ?? []), "id"],
  },
}

const remarkPlugins: PluggableList = [remarkGfm]
const rehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, sanitizeSchema],
]

export function isSafeHref(href: string | undefined): href is string {
  if (!href) return false

  const trimmed = href.trim().toLowerCase()

  return (
    // eslint-disable-next-line sonarjs/code-eval
    !trimmed.startsWith("javascript:") &&
    !trimmed.startsWith("data:") &&
    !trimmed.startsWith("vbscript:")
  )
}

const defaultComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-foreground mt-8 mb-4 scroll-mt-24 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2
      id={headingId(children)}
      className="text-foreground mt-6 mb-3 scroll-mt-24 text-xl leading-tight font-bold tracking-tight sm:text-2xl"
    >
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3
      id={headingId(children)}
      className="text-foreground mt-4 mb-3 scroll-mt-24 text-lg leading-tight font-bold tracking-tight sm:text-xl"
    >
      {children}
    </h3>
  ),

  h4: ({ children }) => (
    <h4 className="text-foreground mt-4 mb-2 text-base leading-tight font-bold tracking-tight sm:text-lg">
      {children}
    </h4>
  ),

  h5: ({ children }) => (
    <h5 className="text-foreground mt-4 mb-2 text-base leading-tight font-bold tracking-tight">
      {children}
    </h5>
  ),

  h6: ({ children }) => (
    <h6 className="text-foreground mt-4 mb-2 text-sm leading-tight font-bold tracking-tight">
      {children}
    </h6>
  ),

  p: ({ children }) => (
    <MarkdownParagraph className="text-foreground mb-4 text-base leading-relaxed">
      {children}
    </MarkdownParagraph>
  ),

  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),

  em: ({ children }) => <em className="italic">{children}</em>,

  del: ({ children }) => <del className="line-through">{children}</del>,

  u: ({ children }) => <u className="underline">{children}</u>,

  a: ({ href, children }) => {
    const safeHref = isSafeHref(href) ? href : undefined
    const isExternal =
      safeHref?.startsWith("http://") || safeHref?.startsWith("https://")

    return (
      <a
        href={safeHref}
        className="text-strapi-purple-600 hover:text-strapi-purple-700 underline transition-colors"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    )
  },

  ul: ({ children }) => (
    <ul className="mb-4 list-outside list-disc space-y-1 pl-6">{children}</ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-4 list-outside list-decimal space-y-1 pl-6">
      {children}
    </ol>
  ),

  li: ({ children }) => <li className="text-base">{children}</li>,

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

  pre: ({ node, children }) => (
    <MarkdownPre
      node={node}
      className="bg-muted mb-4 overflow-x-auto rounded-lg p-4 font-mono text-sm [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0"
    >
      {children}
    </MarkdownPre>
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

export function Markdown({
  children,
  className,
  components: overrides,
}: MarkdownProps) {
  if (!children) {
    return null
  }

  const components = overrides
    ? { ...defaultComponents, ...overrides }
    : defaultComponents

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
