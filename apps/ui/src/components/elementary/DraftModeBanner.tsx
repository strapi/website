import { draftMode } from "next/headers"

/**
 * Site-wide indicator that the current browser is in Next.js draft mode
 * (planted by `/api/preview` when an editor opens a Strapi preview). Without
 * it, editors keep browsing draft content with no clue why the site differs
 * from what visitors see. Reading `draftMode()` here is safe for static
 * rendering — it is `false` during prerender, and requests carrying the
 * bypass cookie render dynamically.
 */
export async function DraftModeBanner() {
  const dm = await draftMode()

  if (!dm.isEnabled) {
    return null
  }

  return (
    <div className="fixed bottom-4 z-50 flex w-full items-center justify-center px-4">
      <div className="inline-flex items-center gap-3 rounded-full bg-amber-500 py-2 pr-2 pl-4 text-sm font-medium text-black shadow-lg">
        <span>Draft mode — you are viewing unpublished content</span>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/exit-preview"
          className="rounded-full bg-black px-3 py-1 text-white transition-opacity hover:opacity-80"
        >
          Exit
        </a>
      </div>
    </div>
  )
}
