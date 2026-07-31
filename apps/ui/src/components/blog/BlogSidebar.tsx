import type { Data } from "@repo/strapi-types"

import { StrapiCtaCard } from "@/components/page-builder/components/cards/StrapiCtaCard"
import { cn } from "@/lib/styles"

type CtaCard = Data.Component<"cards.cta-card">

interface BlogSidebarProps {
  /** Cards set on the post itself. When non-empty these replace the default. */
  readonly postCards?: CtaCard[] | null
  /** Blog-wide default cards from the Blog single type. */
  readonly defaultCards?: CtaCard[] | null
  /**
   * `column` is the fixed-width sticky rail beside the article.
   * `inline` flows the cards into the article width once there is no room
   * beside it — without this they keep the rail's narrow width and look broken.
   */
  readonly variant?: "column" | "inline"
  readonly className?: string
  /** Applied to the card wrapper — used to make the column stick on scroll. */
  readonly innerClassName?: string
}

/**
 * Blog post side column.
 *
 * Cards are configured blog-wide on the Blog single type and can be overridden
 * per post. The override is all-or-nothing rather than a merge: merge order
 * would be ambiguous and invisible to the editor.
 *
 * Renders nothing when neither source has cards, so posts without a sidebar
 * keep the original centered layout.
 */
export function BlogSidebar({
  postCards,
  defaultCards,
  variant = "column",
  className,
  innerClassName,
}: BlogSidebarProps) {
  const cards = postCards?.length ? postCards : (defaultCards ?? [])

  if (cards.length === 0) {
    return null
  }

  return (
    <aside
      data-slot="blog-sidebar"
      data-variant={variant}
      aria-label="Related resources"
      className={className}
    >
      <div
        className={cn(
          "gap-4",
          variant === "column"
            ? "flex w-70 flex-col"
            : "grid grid-cols-1 sm:grid-cols-2",
          innerClassName
        )}
      >
        {cards.map((card) => (
          <StrapiCtaCard key={card.id} component={card} />
        ))}
      </div>
    </aside>
  )
}
