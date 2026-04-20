const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
])

const TWITTER_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
])

function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function getYouTubeId(url: string): string | null {
  const parsed = parseUrl(url)
  if (!parsed || !YOUTUBE_HOSTS.has(parsed.hostname)) return null

  if (parsed.hostname.endsWith("youtu.be")) {
    const id = parsed.pathname.slice(1).split("/")[0]

    return id || null
  }

  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v")
  }

  const [, prefix, id] = parsed.pathname.split("/")

  if (prefix === "embed" || prefix === "shorts" || prefix === "v") {
    return id || null
  }

  return null
}

export function getTweetId(url: string): string | null {
  const parsed = parseUrl(url)
  if (!parsed || !TWITTER_HOSTS.has(parsed.hostname)) return null

  const match = /^\/(?:[^/]+)\/status\/(\d+)/.exec(parsed.pathname)

  return match?.[1] ?? null
}

export function isEmbeddableUrl(url: string): boolean {
  return getYouTubeId(url) !== null || getTweetId(url) !== null
}
