import type { Core } from "@strapi/strapi"

import {
  REVALIDATE_BY_UID,
  RevalidatePolicies,
  type RevalidateCollectionConfig,
  type RevalidatePolicy,
} from "../revalidate/config"

/**
 * Document Service middleware for automatic frontend cache revalidation.
 */
export const registerAutoRevalidateMiddleware = ({
  strapi,
}: {
  strapi: Core.Strapi
}) => {
  strapi.documents.use(async (context, next) => {
    const uid = context.uid
    const config = uid ? REVALIDATE_BY_UID.get(uid) : undefined

    if (!uid || !config) {
      return next()
    }

    const params = toRecord(context.params) ?? {}
    const data = toRecord(params.data)

    // Internal hierarchy jobs update documents with `updatedBy: null`
    // in `src/utils/hierarchy/index.ts`. Skip middleware-level revalidation
    // to avoid duplicate calls for those system writes.
    if (context.action === "update" && data?.updatedBy === null) {
      return next()
    }

    const action = context.action
    const hasDraftAndPublish =
      context.contentType?.options?.draftAndPublish === true
    const statusFromParams =
      getString(data?.status) ?? getString(params.status) ?? undefined

    if (
      !shouldRevalidate(
        action,
        statusFromParams,
        hasDraftAndPublish,
        config.policy
      )
    ) {
      return next()
    }

    const nextResult = await next()
    const effectiveResult = unwrapDocumentResult(nextResult, params.locale)
    const locale =
      getString(effectiveResult?.locale) ?? getString(params.locale)
    const status =
      getString(effectiveResult?.status) ?? getString(params.status)

    if (!shouldRevalidate(action, status, hasDraftAndPublish, config.policy)) {
      return nextResult
    }
    const revalidateService = strapi.service("api::revalidate.revalidate")

    try {
      if (config.mode === "tag-revalidate") {
        await revalidateService.run({ uid, tags: config.tags })

        return nextResult
      }

      const fullPaths = resolveFullPaths(config, effectiveResult)

      if (fullPaths.length === 0) {
        return nextResult
      }

      await revalidateService.run({
        uid,
        fullPaths,
        locale,
        tags: config.tags,
      })
    } catch (error) {
      strapi.log.error(
        `[auto-revalidate] Failed for uid="${uid}" action="${action}": ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }

    return nextResult
  })
}

function resolveFullPaths(
  config: RevalidateCollectionConfig,
  doc: Record<string, unknown> | undefined
): string[] {
  if (!doc) {
    return []
  }

  if (config.pathBuilder) {
    const built = config.pathBuilder(doc, getString(doc.locale))

    if (!built) {
      return []
    }

    const candidates = Array.isArray(built) ? built : [built]

    return candidates
      .map((value) => getString(value))
      .filter((value): value is string => value != null)
  }

  const pathField = config.pathField ?? "fullPath"
  const fullPath = getString(doc[pathField])

  return fullPath ? [fullPath] : []
}

function shouldRevalidate(
  action: string | undefined,
  status: string | undefined,
  hasDraftAndPublish: boolean,
  policy: RevalidatePolicy | undefined
): boolean {
  if (!isWriteAction(action)) {
    return false
  }

  // When no explicit policy is set, derive from the content type's draftAndPublish setting:
  // - draftAndPublish enabled → "publish-only" (wait for publish/unpublish/delete)
  // - draftAndPublish disabled → "all-writes" (every save is immediately public)
  const resolvedPolicy =
    policy ??
    (hasDraftAndPublish
      ? RevalidatePolicies.PublishOnly
      : RevalidatePolicies.AllWrites)

  if (resolvedPolicy === RevalidatePolicies.AllWrites) {
    return true
  }

  if (action === "delete" && status === "draft") {
    return false
  }

  if (action === "publish" || action === "unpublish" || action === "delete") {
    return true
  }

  // Some Strapi publish flows surface as update with published status.
  return action === "update" && status === "published"
}

function isWriteAction(action: string | undefined): boolean {
  return (
    action === "create" ||
    action === "update" ||
    action === "delete" ||
    action === "publish" ||
    action === "unpublish"
  )
}

function getString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  return value as Record<string, unknown>
}

/**
 * Strapi v5 publish/unpublish/delete actions return `{ entries: [...] }`
 * instead of a flat document. This extracts the first matching entry
 * (by locale if available) so field access works uniformly.
 */
function unwrapDocumentResult(
  result: unknown,
  localeParam: unknown
): Record<string, unknown> | undefined {
  const record = toRecord(result)

  if (!record) {
    return undefined
  }

  if (!Array.isArray(record.entries)) {
    return record
  }

  const locale = getString(localeParam)
  const entries = record.entries as Record<string, unknown>[]

  if (locale) {
    const localeMatch = entries.find((e) => getString(e.locale) === locale)

    if (localeMatch) {
      return localeMatch
    }
  }

  return toRecord(entries[0])
}
