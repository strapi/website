import qs from "qs"

import { SourceClient } from "../clients/source.ts"
import { loadEnv, type MigrationEnv } from "../config/env.ts"
import { createLogger, type Logger } from "../utils/logger.ts"

const HOST_PATH = "/cloud-legal"
const SOURCE_SLUG = "cloud-legal"
const SLUG_MAX = 80

export type LegalSection = {
  title: string
  slug: string
  content: string
}

export type LegalSplit = {
  host: LegalSection
  legalPages: LegalSection[]
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])

/** Abort unless the configured target is a loopback address. This command never writes. */
export function assertLocalTarget(targetUrl: string): void {
  let hostname: string

  try {
    hostname = new URL(targetUrl).hostname
  } catch {
    throw new Error("Refusing to run: TARGET_URL is not a valid URL")
  }

  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to run: TARGET_URL host "${hostname}" is not local. split-cloud-legal never writes and never runs against a remote target.`
    )
  }
}

export function slugifyHeading(title: string): string {
  const normalized = title
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replaceAll("&", " and ")

  let slug = ""
  let pendingDash = false

  for (const char of normalized) {
    const isSlugChar =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9")

    if (isSlugChar) {
      if (pendingDash && slug.length > 0) slug += "-"

      pendingDash = false
      slug += char
    } else {
      pendingDash = true
    }
  }

  return slug.slice(0, SLUG_MAX) || "section"
}

export function wordCount(text: string): number {
  const trimmed = text.trim()

  if (!trimmed) return 0

  return trimmed.split(/\s+/).length
}

function stripTags(value: string): string {
  let result = ""
  let inTag = false

  for (const char of value) {
    if (char === "<") {
      inTag = true
      continue
    }

    if (char === ">") {
      inTag = false
      continue
    }

    if (!inTag) result += char
  }

  return result
}

function cleanHeading(raw: string): string {
  const text = stripTags(raw)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("*", "")
    .replaceAll("_", "")
    .replaceAll("`", "")

  return text.split(/\s+/).join(" ").trim()
}

type HeadingMark = { index: number; title: string }

function markdownH1s(body: string): HeadingMark[] {
  const marks: HeadingMark[] = []
  let inFence = false
  let offset = 0

  for (const line of body.split("\n")) {
    if (/^(`{3,}|~{3,})/.test(line.trim())) {
      inFence = !inFence
    } else if (!inFence && line.startsWith("# ") && !line.startsWith("##")) {
      let title = line.slice(2).trim()

      while (title.endsWith("#")) {
        title = title.slice(0, -1).trim()
      }

      const cleaned = cleanHeading(title)

      if (cleaned) marks.push({ index: offset, title: cleaned })
    }

    offset += line.length + 1
  }

  return marks
}

function htmlH1s(body: string): HeadingMark[] {
  const marks: HeadingMark[] = []
  const pattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi

  for (const match of body.matchAll(pattern)) {
    const title = cleanHeading(match[1] ?? "")

    if (!title || match.index == null) continue

    marks.push({ index: match.index, title })
  }

  return marks
}

function headings(body: string): HeadingMark[] {
  const markdown = markdownH1s(body)
  const html = htmlH1s(body)

  return html.length > markdown.length ? html : markdown
}

function uniqueSlug(title: string, used: Set<string>): string {
  const base = slugifyHeading(title)
  let slug = base
  let n = 2

  while (used.has(slug)) {
    const suffix = `-${n}`
    slug = `${base.slice(0, SLUG_MAX - suffix.length)}${suffix}`
    n += 1
  }

  used.add(slug)

  return slug
}

/** Split a legal document on top-level headings. The first section stays on the host page. */
export function splitLegalDocument(body: string): LegalSplit | null {
  const marks = headings(body)

  if (marks.length === 0) return null

  const used = new Set<string>()
  const sections: LegalSection[] = marks.map((mark, index) => {
    const end = marks[index + 1]?.index ?? body.length

    return {
      title: mark.title,
      slug: uniqueSlug(mark.title, used),
      content: body.slice(mark.index, end).trim(),
    }
  })

  const host = sections[0]

  if (!host) return null

  const preamble = body.slice(0, marks[0]?.index ?? 0).trim()

  if (preamble) {
    host.content = `${preamble}\n\n${host.content}`.trim()
  }

  return { host, legalPages: sections.slice(1) }
}

/** Longest string in a payload that contains a top-level heading. */
export function findLongestProse(value: unknown): string | null {
  let best: string | null = null
  const seen = new Set<unknown>()

  const visit = (node: unknown) => {
    if (typeof node === "string") {
      if (
        splitLegalDocument(node) &&
        (best == null || node.length > best.length)
      ) {
        best = node
      }

      return
    }

    if (!node || typeof node !== "object" || seen.has(node)) return

    seen.add(node)

    if (Array.isArray(node)) {
      for (const item of node) visit(item)

      return
    }

    for (const child of Object.values(node)) visit(child)
  }

  visit(value)

  return best
}

function readStringField(entity: unknown, field: string): string | null {
  if (!entity || typeof entity !== "object") return null

  const record = entity as Record<string, unknown>
  const direct = record[field]

  if (typeof direct === "string" && direct.trim()) return direct.trim()

  const attributes = record["attributes"]

  if (attributes && typeof attributes === "object") {
    const nested = (attributes as Record<string, unknown>)[field]

    if (typeof nested === "string" && nested.trim()) return nested.trim()
  }

  return null
}

async function readLocalCloudLegal(env: MigrationEnv): Promise<unknown | null> {
  const params = qs.stringify(
    {
      filters: { fullPath: { $eq: HOST_PATH } },
      locale: "en",
      status: "published",
      populate: {
        content: {
          on: {
            "sections.richtext": true,
            "sections.legal-pages": { populate: { legalPages: true } },
          },
        },
      },
      pagination: { page: 1, pageSize: 1 },
    },
    { encodeValuesOnly: true }
  )
  const url = `${env.target.baseUrl}/api/pages?${params}`
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.target.token}`,
    },
    signal: AbortSignal.timeout(8000),
  })

  if (response.status === 404) return null

  if (!response.ok) {
    throw new Error(`Local pages GET failed (${response.status})`)
  }

  const json = (await response.json()) as { data?: unknown[] }

  return json.data?.[0] ?? null
}

async function readSourceCloudLegal(
  env: MigrationEnv,
  logger: Logger
): Promise<unknown | null> {
  const source = new SourceClient({ env, logger })
  const list = await source.fetchAll("universals", {
    slugFilter: SOURCE_SLUG,
    limit: 1,
  })
  const first = list[0]

  if (!first) return null

  const nestedPopulate = {
    slices: {
      populate: {
        content: { populate: "*" },
        text: true,
        intro: { populate: "*" },
      },
    },
    seo: { populate: "*" },
  }

  try {
    const nested = await source.fetchOne("universals", first.id, nestedPopulate)

    if (findLongestProse(nested)) return nested
  } catch (error) {
    logger.warn(
      `Nested source populate failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  try {
    return await source.fetchOne("universals", first.id, "deep")
  } catch {
    return first
  }
}

function printSplit(
  logger: Logger,
  origin: string,
  hostTitle: string,
  hostPath: string,
  split: LegalSplit
) {
  logger.info(`Body source: ${origin}`)
  logger.info(
    `Host page keeps the first heading (${wordCount(split.host.content)} words)`
  )
  logger.info("Side panel:")
  logger.info(
    `  1. ${hostTitle}  →  ${hostPath}  (host page, ${wordCount(split.host.content)} words)`
  )

  split.legalPages.forEach((page, index) => {
    logger.info(
      `  ${index + 2}. ${page.title}  →  ${hostPath.replace(/\/$/, "")}/${page.slug}  (legal page, ${wordCount(page.content)} words)`
    )
  })

  if (split.legalPages.length === 0) {
    logger.warn("No headings after the first one. No legal pages to create.")
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function readOptional(
  logger: Logger,
  label: string,
  read: () => Promise<unknown>
): Promise<unknown | null> {
  try {
    return await read()
  } catch (error) {
    logger.warn(`${label} was not read: ${errorText(error)}`)

    return null
  }
}

function nothingWrittenMessage(hadBody: boolean): string {
  const reason = hadBody
    ? "No top-level headings found in cloud-legal content."
    : "cloud-legal could not be read from the local target or the source API."

  return `${reason} Nothing was written.`
}

/**
 * Read cloud-legal and print the side-panel split.
 * There is no write path: this function only GETs and logs.
 */
export async function runSplitCloudLegal(): Promise<void> {
  const env = loadEnv()
  assertLocalTarget(env.target.baseUrl)

  const logger = createLogger(false)
  logger.header("split-cloud-legal")
  logger.info(
    "Dry run only. This command does not create, update, or publish content."
  )

  const local = await readOptional(logger, "Local page", () =>
    readLocalCloudLegal(env)
  )
  const source = await readOptional(logger, "Source page", () =>
    readSourceCloudLegal(env, logger)
  )
  const localBody = local ? findLongestProse(local) : null
  const sourceBody = source ? findLongestProse(source) : null
  const localSplit = localBody ? splitLegalDocument(localBody) : null
  const sourceSplit = sourceBody ? splitLegalDocument(sourceBody) : null
  const useLocal =
    localSplit != null &&
    (localSplit.legalPages.length ?? 0) >=
      (sourceSplit?.legalPages.length ?? -1)
  const chosen = useLocal ? localSplit : sourceSplit

  if (!chosen) {
    const message = nothingWrittenMessage(Boolean(localBody || sourceBody))
    logger.error(message)

    throw new Error(message)
  }

  const hostPath = readStringField(local, "fullPath") ?? HOST_PATH
  const hostTitle = readStringField(local, "title") ?? chosen.host.title

  printSplit(
    logger,
    useLocal ? `local page ${hostPath}` : `source universal ${SOURCE_SLUG}`,
    hostTitle,
    hostPath,
    chosen
  )

  logger.success("Dry run finished. No content was created or updated.")
}
