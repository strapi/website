import { randomUUID } from "node:crypto"

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"

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
 * without CloudFront (local, previews) silently no-op.
 *
 * Credentials come from Vercel OIDC federation: the function's
 * `VERCEL_OIDC_TOKEN` is exchanged for temporary credentials of
 * `AWS_CLOUDFRONT_INVALIDATION_ROLE_ARN` via STS AssumeRoleWithWebIdentity.
 * The explicit provider is required on Vercel — its functions run on AWS
 * Lambda, which injects non-functional AWS_ACCESS_KEY_ID/
 * AWS_SECRET_ACCESS_KEY/AWS_SESSION_TOKEN into the runtime env, so the
 * SDK's default provider chain "finds" credentials that fail every call
 * (https://vercel.com/docs/environment-variables/reserved-environment-variables).
 * Without the role ARN the default chain (IAM role, etc.) still works as a
 * fallback off Vercel.
 *
 * Path/tag translation rules live in `lib/cdn-paths.ts`.
 */

let cloudFrontClient: CloudFrontClient | undefined

function getCloudFrontClient(): CloudFrontClient {
  cloudFrontClient ??= new CloudFrontClient({
    region: env.AWS_REGION ?? "us-east-1",
    ...(env.AWS_CLOUDFRONT_INVALIDATION_ROLE_ARN
      ? {
          credentials: awsCredentialsProvider({
            roleArn: env.AWS_CLOUDFRONT_INVALIDATION_ROLE_ARN,
          }),
        }
      : {}),
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
    const credentialsHint = !env.AWS_CLOUDFRONT_INVALIDATION_ROLE_ARN
      ? " (AWS_CLOUDFRONT_INVALIDATION_ROLE_ARN is not set — on Vercel the default AWS credential chain picks up Lambda-injected credentials that cannot authorize anything)"
      : !process.env.VERCEL_OIDC_TOKEN
        ? " (VERCEL_OIDC_TOKEN is not available — OIDC federation must be enabled for the Vercel project so the function can assume the CloudFront invalidation role)"
        : ""

    console.error(
      `[revalidate] CloudFront invalidation failed for paths=${JSON.stringify(invalidationPaths)}${credentialsHint}`,
      error
    )

    return false
  }
}
