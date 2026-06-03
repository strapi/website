import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { InlineMarkdown } from "./markdown/InlineMarkdown"

interface Props {
  readonly children: React.ReactNode
  readonly content: string | null | undefined
  readonly contentProps?: Partial<
    React.ComponentPropsWithoutRef<typeof TooltipContent>
  >
}

export function Tooltip({ children, content, contentProps }: Props) {
  return (
    <TooltipProvider>
      <RadixTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent {...contentProps}>
          <InlineMarkdown allowNewLines>{content}</InlineMarkdown>
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  )
}
