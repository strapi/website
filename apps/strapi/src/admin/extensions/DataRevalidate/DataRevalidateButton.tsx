import { Button } from "@strapi/design-system"
import {
  getFetchClient,
  unstable_useContentManagerContext,
  useNotification,
  useQueryParams,
} from "@strapi/strapi/admin"
import { useMemo, useState } from "react"

import {
  REVALIDATE_COLLECTIONS,
  type RevalidateCollectionConfig,
} from "../../../revalidate/config"

type ContentManagerContext = {
  model?: string
  uid?: string
  form?: {
    values?: Record<string, unknown>
    initialValues?: Record<string, unknown>
  }
}

type RevalidateAction = {
  label: string
  successMessage: string
  errorMessage: string
  payload: {
    uid: string
    fullPaths?: string[]
    tags?: string[]
    locale?: string | null
  }
}

const parseString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

/**
 * Action map for the per-uid "Revalidate cache" button. Path-based actions
 * mirror the synthesized routes in `documentMiddlewares/revalidate.ts`; tag-only
 * actions cover single types and embedded collection types.
 */
function buildAction(
  config: RevalidateCollectionConfig,
  slug: string | null,
  fullPath: string | null,
  locale: string | null
): RevalidateAction | null {
  const uid = config.uid
  const tags = config.tags ?? []

  if (config.mode === "tag-revalidate") {
    return {
      label: "Revalidate cache",
      successMessage: "Revalidated cache.",
      errorMessage: "Failed to revalidate cache.",
      payload: { uid, tags: [`strapi:${uid}`, ...tags] },
    }
  }

  if (uid === "api::page.page") {
    if (!fullPath) {
      return null
    }

    return {
      label: "Revalidate cache",
      successMessage: `Revalidated page cache at "${fullPath}".`,
      errorMessage: "Failed to revalidate page cache.",
      payload: {
        uid,
        fullPaths: [fullPath],
        locale,
        tags: tags.length > 0 ? tags : undefined,
      },
    }
  }

  const builder = config.pathBuilder
  if (builder) {
    const built = builder({ slug }, locale ?? undefined)

    if (!built) {
      return null
    }

    const pathCandidates = Array.isArray(built) ? built : [built]
    const fullPaths = pathCandidates
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    if (fullPaths.length === 0) {
      return null
    }

    const path = fullPaths[0] ?? "/"

    return {
      label: "Revalidate cache",
      successMessage: `Revalidated cache at "${path}".`,
      errorMessage: "Failed to revalidate cache.",
      payload: {
        uid,
        fullPaths,
        locale,
        tags: tags.length > 0 ? tags : undefined,
      },
    }
  }

  return null
}

function DataRevalidateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [{ query }] = useQueryParams<{
    locale?: unknown
    plugins?: { i18n?: { locale?: unknown } }
  }>()
  const { post } = getFetchClient()
  const { toggleNotification } = useNotification()
  const ctx = unstable_useContentManagerContext() as ContentManagerContext
  const uid = parseString(ctx?.model ?? ctx?.uid)

  const fullPath = useMemo(() => {
    const values = ctx?.form?.values ?? ctx?.form?.initialValues

    return parseString(values?.fullPath)
  }, [ctx?.form?.initialValues, ctx?.form?.values])

  const slug = useMemo(() => {
    const values = ctx?.form?.values ?? ctx?.form?.initialValues

    return parseString(values?.slug)
  }, [ctx?.form?.initialValues, ctx?.form?.values])

  const locale = useMemo(() => {
    return (
      parseString(query?.plugins?.i18n?.locale) ?? parseString(query?.locale)
    )
  }, [query])

  const action = useMemo(() => {
    if (!uid) {
      return null
    }

    return buildAction(
      REVALIDATE_COLLECTIONS.find(
        (config) => config.uid === uid
      ) as RevalidateCollectionConfig,
      slug,
      fullPath,
      locale
    )
  }, [fullPath, locale, slug, uid])

  if (!action) {
    return null
  }

  const runRevalidate = async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)

    try {
      await post("/api/revalidate", action.payload)
      toggleNotification({
        type: "success",
        message: action.successMessage,
      })
    } catch (error) {
      console.error(`Failed to revalidate cache for ${uid}:`, error)
      toggleNotification({
        type: "danger",
        message: action.errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="danger-light"
      fullWidth
      onClick={runRevalidate}
      loading={isLoading}
      disabled={isLoading}
    >
      {action.label}
    </Button>
  )
}

export default DataRevalidateButton
