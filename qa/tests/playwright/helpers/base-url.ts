const LOCAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|\[::1\]|[^/:]+\.localhost)(:\d+)?(\/|$)/i

/**
 * Normalizes BASE_URL, so a value typed without a protocol (e.g. "strapi.io"
 * in the QA workflow's base_url input) still works: adds https:// (http:// for
 * local hosts) and drops a trailing slash. Throws a clear error for anything
 * that isn't a URL, instead of failing somewhere deep in the config.
 */
export function normalizeBaseUrl(raw: string | undefined): string | undefined {
  const value = raw?.trim()

  if (!value) {
    return undefined
  }

  let withProtocol = value

  if (!/^https?:\/\//i.test(value)) {
    const protocol = LOCAL_HOST_PATTERN.test(value) ? "http" : "https"
    withProtocol = `${protocol}://${value}`
  }

  try {
    const url = new URL(withProtocol)

    return `${url.origin}${url.pathname.replace(/\/$/, "")}`
  } catch {
    throw new Error(
      `Invalid BASE_URL "${raw}" - expected a URL like https://strapi.io`
    )
  }
}
