import type { Icon } from "@phosphor-icons/react"
import {
  InfoIcon,
  LightbulbIcon,
  NoteIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"
import { cn } from "@/lib/styles"

type Variant = "note" | "tip" | "warning" | "info"

const variantConfig: Record<
  Variant,
  {
    container: string
    iconClass: string
    Icon: Icon
  }
> = {
  note: {
    container: "border-strapi-gray-700/50 bg-strapi-gray-900/40",
    iconClass: "text-strapi-gray-300",
    Icon: NoteIcon,
  },
  tip: {
    container: "border-strapi-green-500/30 bg-strapi-green-600/5",
    iconClass: "text-strapi-green-400",
    Icon: LightbulbIcon,
  },
  warning: {
    container: "border-strapi-yellow-500/30 bg-strapi-yellow-600/5",
    iconClass: "text-strapi-yellow-400",
    Icon: WarningIcon,
  },
  info: {
    container: "border-strapi-blue-500/30 bg-strapi-blue-600/5",
    iconClass: "text-strapi-blue-400",
    Icon: InfoIcon,
  },
}

export function StrapiCallout({
  component,
}: {
  readonly component: Data.Component<"blog.callout">
}) {
  const variant = (component.variant ?? "note") as Variant
  const { container, iconClass, Icon } = variantConfig[variant]

  return (
    <section className="py-4 lg:py-6">
      <Container variant="condensed">
        <aside
          role="note"
          className={cn(
            "rounded-strapi-md flex gap-4 border p-5 lg:p-6",
            container
          )}
        >
          <Icon
            className={cn("mt-0.5 size-6 shrink-0", iconClass)}
            weight="fill"
            aria-hidden
          />

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {component.title && (
              <h4 className="text-foreground text-base font-semibold">
                {component.title}
              </h4>
            )}

            <div className="[&_p]:text-base [&_p]:leading-relaxed [&_p:last-child]:mb-0">
              <InlineMarkdown>{component.content}</InlineMarkdown>
            </div>
          </div>
        </aside>
      </Container>
    </section>
  )
}
