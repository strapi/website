import type { Data } from "@repo/strapi-types"

import { InlineMarkdown } from "@/components/elementary/markdown/InlineMarkdown"

import { TopBannerDismiss } from "./TopBannerDismiss"

const STORAGE_KEY_PREFIX = "strapi_top_banner_dismissed"

interface StrapiTopBannerProps {
  readonly component: Data.Component<"navigation.top-banner">
}

/**
 * Deterministic content hash, computed identically on the server and in the
 * dismiss handler. It keys the dismissal in localStorage — when the banner copy
 * changes the hash changes, so a previously-dismissed banner reappears.
 */
function contentHash(str: string): string {
  let hash = 5381

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.codePointAt(i)!) & 0xffffffff
  }

  return Math.abs(hash).toString(36)
}

/**
 * Dismissible announcement banner.
 *
 * The page is statically rendered (force-static/ISR), so the server can't know
 * whether a given visitor dismissed the banner — that's resolved entirely on the
 * client. To avoid a layout-shifting entrance animation, the banner ships in the
 * static HTML already open (zero CLS for the majority who never dismiss it), and
 * a tiny parser-blocking inline script hides it *before first paint* for anyone
 * who already dismissed this version. The flag lives on <html>, outside React's
 * tree, so there's no hydration mismatch (the root <html> sets
 * `suppressHydrationWarning`).
 */
export function StrapiTopBanner({ component }: StrapiTopBannerProps) {
  const content = component.content

  if (!content) {
    return null
  }

  const storageKey = `${STORAGE_KEY_PREFIX}:${contentHash(content)}`

  const noFlashScript = `try{if(localStorage.getItem(${JSON.stringify(
    storageKey
  )})==="1")document.documentElement.dataset.topBannerDismissed="1"}catch(e){}`

  return (
    <>
      {/*
        Runs synchronously before the banner below is parsed/painted, so already
        dismissed visitors never see it flash in. Must stay immediately before
        the banner element in source order.
      */}
      <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />

      <div data-top-banner className="bg-strapi-purple-600 static z-50 h-13">
        <div className="relative flex h-13 w-full items-center justify-center pr-12 pl-6 text-center text-sm text-white md:px-12 md:text-base [&_a]:text-amber-200 [&_a]:underline [&_a]:transition-colors [&_a]:hover:text-amber-100">
          <InlineMarkdown className="truncate">{content}</InlineMarkdown>

          <TopBannerDismiss storageKey={storageKey} />
        </div>
      </div>
    </>
  )
}
