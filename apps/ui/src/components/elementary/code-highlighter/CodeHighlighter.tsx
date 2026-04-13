import { highlightCode } from "@/lib/shiki"
import { cn } from "@/lib/styles"

import { CodeBlockCopyButton } from "./CodeBlockCopyButton"

interface CodeHighlighterProps {
  readonly code: string
  readonly language?: string
  readonly className?: string
}

export function CodeHighlighter({
  code,
  language,
  className,
}: CodeHighlighterProps) {
  const html = highlightCode(code, language)

  return (
    <div
      data-slot="code-highlighter"
      className={cn("relative my-9", className)}
    >
      <CodeBlockCopyButton code={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
