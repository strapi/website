const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

const SRC_RE = /\bsrc=["']([^"']+)["']/i
const VIDEO_ID_RE = /^[\w-]{11}$/
const YOUTUBE_MD_LINK = String.raw`\[https://www\.youtube\.com/watch\?v=[\w-]{11}\]\(https://www\.youtube\.com/watch\?v=[\w-]{11}\)`

function toWatchUrl(src: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(src)
  } catch {
    return null
  }

  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null

  let id: string | null = null

  if (parsed.hostname.endsWith("youtu.be")) {
    id = parsed.pathname.slice(1).split("/")[0] || null
  } else if (parsed.pathname === "/watch") {
    id = parsed.searchParams.get("v")
  } else {
    const [, prefix, maybeId] = parsed.pathname.split("/")
    if (prefix === "embed" || prefix === "shorts" || prefix === "v") {
      id = maybeId || null
    }
  }

  if (!id || !VIDEO_ID_RE.test(id)) return null

  return `https://www.youtube.com/watch?v=${id}`
}

function toMarkdownParagraph(watchUrl: string): string {
  return `\n\n[${watchUrl}](${watchUrl})\n\n`
}

/**
 * Replace YouTube `<iframe>` tags in richtext/markdown with a standalone
 * markdown paragraph of the form:
 *
 *   [https://www.youtube.com/watch?v=VIDEO_ID](https://www.youtube.com/watch?v=VIDEO_ID)
 *
 * Non-YouTube iframes are left untouched. Wrapping `<p>` around a rewritten
 * link is unwrapped so the frontend auto-embed path can see a real markdown
 * paragraph (markdown inside HTML is not parsed).
 */
export function rewriteYouTubeIframes(content: string): {
  text: string
  count: number
} {
  let count = 0

  let text = content.replaceAll(
    /<iframe\b[^>]*>(?:[\s\S]*?<\/iframe>)?/gi,
    (iframe) => {
      const src = iframe.match(SRC_RE)?.[1]
      if (!src) return iframe

      const watchUrl = toWatchUrl(src)
      if (!watchUrl) return iframe

      count++

      return toMarkdownParagraph(watchUrl)
    }
  )

  if (count === 0) {
    return { text: content, count: 0 }
  }

  text = text.replaceAll(
    new RegExp(String.raw`<p[^>]*>((?:\s*${YOUTUBE_MD_LINK})+\s*)<\/p>`, "gi"),
    "\n\n$1\n\n"
  )
  text = text.replaceAll(/\n{3,}/g, "\n\n")

  return { text, count }
}
