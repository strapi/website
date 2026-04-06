"use client"

import { Box } from "@/components/elementary/box/Box"
import { CopyButton } from "@/components/elementary/CopyButton"
import { Button } from "@/components/ui/button"
import { useClip } from "@/hooks/useClip"
import { cn } from "@/lib/styles"

export interface CommandCTAProps extends React.ComponentProps<"div"> {
  readonly title: string
  readonly description?: string
  readonly codeSnippet?: string
  readonly ctaLabel?: string
}

export function CommandCTA({
  title,
  description,
  codeSnippet,
  ctaLabel = "Copy",
  className,
  ...props
}: CommandCTAProps) {
  const { copied, copy } = useClip()

  const handleCopy = async () => {
    await copy(codeSnippet)
  }

  return (
    <Box
      data-slot="command-cta"
      variant="dark"
      className={cn("rounded-xl p-8", className)}
      {...props}
    >
      <div className="relative z-10">
        <h3 className="mb-4 text-2xl font-semibold text-white">{title}</h3>

        {description && (
          <p className="mb-5 text-base text-white">{description}</p>
        )}

        {codeSnippet && (
          <div className="relative">
            <CopyButton
              copyContent={codeSnippet}
              copied={copied}
              copy={copy}
              copyLabel="Copy code"
              copiedLabel="Code copied"
              className="absolute top-3 right-3 z-10 text-white/70 hover:text-white"
              iconClassName="size-[18px]"
            />

            <pre className="rounded-strapi-sm bg-emerald-700 p-3 pr-10">
              <code className="wrap font-mono text-base text-wrap text-white">
                {codeSnippet}
              </code>
            </pre>
          </div>
        )}

        {codeSnippet && (
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="mt-4 w-full"
          >
            {copied ? "Copied!" : ctaLabel}
          </Button>
        )}
      </div>
    </Box>
  )
}
