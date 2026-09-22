import { logNonBlockingError } from "@/lib/logging"

/**
 * Log an upstream Strapi failure, then rethrow so ISR revalidation does not
 * succeed as `notFound()` and replace a good cached page with a 404.
 */
export function logAndRethrow(message: string, error: unknown): never {
  logNonBlockingError({
    message,
    error: {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  })

  throw error
}
