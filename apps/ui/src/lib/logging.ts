import { getEnvVar } from "@/lib/env-vars"

/**
 * Logs non-blocking errors (failed API fetches, missing env vars, etc.) that degrade
 * a page but don't crash it. Always logged — these are rare, actionable failures and
 * suppressing them hides real outages (e.g. a form silently caching its error fallback).
 * For repetitive CMS data-quality issues use logNonBlockingWarning instead.
 * @param args - Arguments to pass to console.error (same signature as console.error)
 */
export const logNonBlockingError = (...args: unknown[]) => {
  console.error(...args)
}

/**
 * Logs non-blocking warnings (CMS data quality issues, etc.) using console.warn.
 * Gated behind SHOW_NON_BLOCKING_ERRORS — these fire per render across many pages
 * and would otherwise flood build output.
 */
export const logNonBlockingWarning = (...args: unknown[]) => {
  const showErrors = getEnvVar("SHOW_NON_BLOCKING_ERRORS")

  if (showErrors) {
    console.warn(...args)
  }
}
