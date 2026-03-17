/**
 * Redirect migration is straightforward.
 *
 * v4 schema: source, destination, permanent (default: true)
 * v5 schema: source, destination, permanent (default: false)
 *
 * Fields map 1:1. Only difference is the default for `permanent`.
 * Since we read explicit values from v4, this doesn't matter.
 */

export const REDIRECT_MIGRATION_NOTES = `
v4 → v5 Redirect mapping:
  source → source
  destination → destination
  permanent → permanent
  Dedup by: source field
`
