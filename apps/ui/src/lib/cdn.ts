/**
 * AWS CloudFront cache invalidation. Currently a no-op stub.
 *
 * TODO(infra): when CloudFront is provisioned, wire this to call
 * `CreateInvalidationCommand` from `@aws-sdk/client-cloudfront`.
 *
 * Required env when implemented:
 *  - AWS_CLOUDFRONT_DISTRIBUTION_ID
 *  - AWS_REGION
 *  - IAM credentials (via the standard SDK provider chain)
 *
 * Notes for the future implementation:
 *  - Path invalidations cost money and have a per-distribution rate limit;
 *    deduplicate inputs and prefer batched invalidations.
 *  - Tag-driven invalidations have no direct CloudFront equivalent — single-types
 *    like header/footer would need a wildcard purge ("/*") which is heavy.
 */

export async function purgeCDNCache(contentPaths: string[]): Promise<boolean> {
  // Intentionally a no-op until CloudFront is provisioned.
  return false
}
