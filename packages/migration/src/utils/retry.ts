import type { Logger } from "./logger.ts"

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  logger?: Logger
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 3
  const baseDelay = opts.baseDelay ?? 1000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isHttpRetryable =
        err instanceof Error &&
        "status" in err &&
        typeof (err as Record<string, unknown>)["status"] === "number" &&
        [429, 500, 502, 503, 504].includes(
          (err as Record<string, unknown>)["status"] as number
        )

      // Also retry network-level errors (TypeError: fetch failed, ECONNRESET, etc.)
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error &&
          /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up/i.test(
            err.message
          ))

      const isRetryable = isHttpRetryable || isNetworkError

      if (!isRetryable || attempt === maxRetries) {
        throw err
      }

      const delay = baseDelay * Math.pow(2, attempt)
      const reason =
        err instanceof Error ? err.message.slice(0, 200) : String(err)
      opts.logger?.warn(
        `Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}) — ${reason}`
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw new Error("Unreachable")
}
