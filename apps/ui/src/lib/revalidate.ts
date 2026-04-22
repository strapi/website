import { getEnvVar } from "@/lib/env-vars"

const DEFAULT_REVALIDATE_SECONDS = 60 * 60 * 4

export const PAGE_REVALIDATE_SECONDS =
  getEnvVar("DEFAULT_REVALIDATE_TIME") ?? DEFAULT_REVALIDATE_SECONDS
