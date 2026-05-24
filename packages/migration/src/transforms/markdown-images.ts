import type { TransformFn, TransformContext } from "./base.ts"

// URL group allows one level of balanced parens, e.g. `Untitled_(1).png`.
// Markdown spec allows balanced parens; we don't recurse deeper than 1 because
// nested parens in image URLs are vanishingly rare.
const MARKDOWN_IMG =
  /!\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))+)(?:\s+"[^"]*")?\)/g
const HTML_IMG_SRC = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g

/**
 * Walk the entity tree, find markdown/HTML image syntax in string fields,
 * upload any v4-CDN images to v5, and rewrite URLs in-place.
 *
 * Scope: every string field (richtext, content, markdown blocks inside sections).
 * The `uploadMedia` transform handles structured component media — this is for
 * URLs embedded in text bodies that wouldn't be reached by tree-walking shapes.
 *
 * Uses MediaCache to dedupe uploads across runs.
 * In dry-run mode, skips uploads (cache hits still rewrite).
 */
export const processMarkdownImages: TransformFn = async (entity, ctx) => {
  return (await processNode(entity, ctx)) as Record<string, unknown>
}

async function processNode(
  obj: unknown,
  ctx: TransformContext
): Promise<unknown> {
  if (typeof obj === "string") {
    return rewriteMarkdownImages(obj, ctx)
  }

  if (Array.isArray(obj)) {
    const out: unknown[] = []

    for (const item of obj) {
      out.push(await processNode(item, ctx))
    }

    return out
  }

  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      out[key] = await processNode(value, ctx)
    }

    return out
  }

  return obj
}

export async function rewriteMarkdownImages(
  text: string,
  ctx: TransformContext
): Promise<string> {
  const urls = collectV4ImageUrls(text, ctx)
  if (urls.size === 0) return text

  const urlMap = new Map<string, string>()

  for (const v4Url of urls) {
    const v5Url = await uploadAndGetV5Url(v4Url, ctx)
    if (v5Url) urlMap.set(v4Url, v5Url)
  }

  if (urlMap.size === 0) return text

  // Single regex pass instead of repeated `replaceAll(v4Url, v5Url)` — a naive
  // `replaceAll` over each entry can corrupt URLs when one v4 URL is a prefix
  // of another (e.g. `…/img.png` and `…/img.png?v=2`). Reusing the same
  // capture regexes guarantees we only rewrite inside image syntax, not
  // arbitrary substring matches. Both replacers swap the URL token inside the
  // matched segment so optional markdown title text and html attributes stay
  // intact.
  return text
    .replaceAll(MARKDOWN_IMG, (match, _alt, url: string) => {
      const mapped = urlMap.get(url)

      return mapped ? match.replace(url, mapped) : match
    })
    .replaceAll(HTML_IMG_SRC, (match, url: string) => {
      const mapped = urlMap.get(url)

      return mapped ? match.replace(url, mapped) : match
    })
}

function collectV4ImageUrls(text: string, ctx: TransformContext): Set<string> {
  const hostPattern = sourceHostPattern(ctx)
  const urls = new Set<string>()

  for (const m of text.matchAll(MARKDOWN_IMG)) {
    const u = m[2]
    if (u && hostPattern.test(u)) urls.add(u)
  }

  for (const m of text.matchAll(HTML_IMG_SRC)) {
    const u = m[1]
    if (u && hostPattern.test(u)) urls.add(u)
  }

  return urls
}

function sourceHostPattern(ctx: TransformContext): RegExp {
  const host = new URL(ctx.env.source.baseUrl).host

  return new RegExp(
    String.raw`^https?://${host.replaceAll(".", String.raw`\.`)}\b`,
    "i"
  )
}

async function uploadAndGetV5Url(
  v4Url: string,
  ctx: TransformContext
): Promise<string | undefined> {
  const cached = ctx.mediaCache.get(v4Url)

  if (cached?.url) {
    return cached.url
  }

  if (ctx.dryRun) {
    ctx.logger.debug(`DRY: would upload markdown image ${v4Url}`)

    return undefined
  }

  const result = await ctx.targetClient.uploadMedia(v4Url)

  if (!result) {
    ctx.logger.warn(`Failed to upload markdown image: ${v4Url}`)

    return undefined
  }

  ctx.mediaCache.set(v4Url, {
    id: result.id,
    hash: result.hash,
    url: result.url,
  })

  if (ctx.mediaCache.size % 20 === 0) {
    await ctx.mediaCache.save()
  }

  ctx.logger.debug(`Uploaded markdown image: ${v4Url} → ${result.url}`)

  return result.url
}
