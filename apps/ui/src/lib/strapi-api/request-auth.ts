import { getEnvVar } from "@/lib/env-vars"

const ALLOWED_STRAPI_ENDPOINTS: Record<string, string[]> = {
  GET: ["api/pages", "api/footer", "api/navbar"],
}

/**
 * Check if the given Strapi Admin/API path is allowed to be accessed
 * with the provided HTTP method.
 */
export const isStrapiEndpointAllowed = (
  path: string,
  method: string
): boolean => {
  return (
    ALLOWED_STRAPI_ENDPOINTS[method]?.some((endpoint) =>
      path.startsWith(endpoint)
    ) ?? false
  )
}

/**
 * Create Strapi authorization header based on the request type.
 * Uses the appropriate API token based on read-only status.
 */
export const createStrapiAuthHeader = async ({
  isReadOnly,
}: {
  isReadOnly?: boolean
}) => {
  const apiToken = isReadOnly
    ? getEnvVar("STRAPI_REST_READONLY_API_KEY")
    : getEnvVar("STRAPI_REST_CUSTOM_API_KEY")

  return formatStrapiAuthorizationHeader(apiToken)
}

export const formatStrapiAuthorizationHeader = (token?: string) => {
  if (!token) {
    return {} as Record<string, string>
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}
