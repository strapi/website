import { randomUUID } from "node:crypto"

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"

import { env } from "@/env.mjs"
import {
  resolveCDNInvalidationPaths,
  type PurgeCDNCacheInput,
} from "@/lib/cdn-paths"
import { routing } from "@/lib/navigation"

/**
 * AWS CloudFront cache invalidation, called from the Strapi revalidation
 * webhook right after Next.js `revalidatePath`/`revalidateTag` so the CDN
 * never outlives the origin cache.
 *
 * Enabled only when `AWS_CLOUDFRONT_DISTRIBUTION_ID` is set — deployments
 * without CloudFront (local, previews) silently no-op. Credentials resolve
 * through the standard SDK provider chain (IAM role, or
 * AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY).
 *
 * Path/tag translation rules live in `lib/cdn-paths.ts`.
 */

let cloudFrontClient: CloudFrontClient | undefined

function getCloudFrontClient(): CloudFrontClient {
  cloudFrontClient ??= new CloudFrontClient({
    region: env.AWS_REGION ?? "us-east-1",
  })

  return cloudFrontClient
}

/**
 * Creates a CloudFront invalidation for the given revalidation payload.
 * Returns `true` on success, `false` when disabled or on failure — errors
 * are logged but never fail the revalidation webhook, since the origin
 * cache is already refreshed and the CDN will self-heal via TTL.
 */
export async function purgeCDNCache(
  input: PurgeCDNCacheInput
): Promise<boolean> {
  const distributionId = env.AWS_CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) {
    return false
  }

  const invalidationPaths = resolveCDNInvalidationPaths(input, routing.locales)
  if (invalidationPaths.length === 0) {
    return false
  }

  try {
    const response = await getCloudFrontClient().send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: randomUUID(),
          Paths: {
            Quantity: invalidationPaths.length,
            Items: invalidationPaths,
          },
        },
      })
    )

    console.debug(
      `[revalidate] CloudFront invalidation "${response.Invalidation?.Id}" created for paths=${JSON.stringify(invalidationPaths)}`
    )

    return true
  } catch (error) {
    console.error(
      `[revalidate] CloudFront invalidation failed for paths=${JSON.stringify(invalidationPaths)}`,
      error
    )

    return false
  }
}
