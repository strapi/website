import type { AuthorAvatarData } from "@/components/elementary/AuthorAvatars"

export const BLOG_HEADER_OFFSET = 96

export interface BlogCategory {
  readonly name?: string
  readonly slug?: string
}

export interface BlogTag {
  readonly id: number
  readonly name?: string
  readonly slug?: string
}

export interface BlogPostImage {
  readonly image?: Record<string, unknown> | null
}

export function combineAuthors(
  author: AuthorAvatarData | null | undefined,
  coauthors?: readonly AuthorAvatarData[]
): AuthorAvatarData[] {
  return [...(author ? [author] : []), ...(coauthors ?? [])]
}

function stripMarkup(content: string): string {
  return content
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replaceAll(/\[[^\]]*\]\([^)]*\)/g, "")
    .replaceAll(/^#{1,6}\s+/gm, "")
    .replaceAll(/[*_~`>\-|]/g, "")
    .replaceAll(/\n+/g, " ")
    .trim()
}

export function calculateReadTime(content: string | null | undefined): number {
  if (!content) return 0

  const plainText = stripMarkup(content)
  const wordCount = plainText.split(/\s+/).filter(Boolean).length

  return Math.max(1, Math.ceil(wordCount / 200))
}

export function getExcerpt(
  content: string | null | undefined,
  maxLength = 200
): string {
  if (!content) return ""

  const plain = stripMarkup(content)

  if (plain.length <= maxLength) return plain

  const truncated = plain.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "..."
}

export interface TocHeading {
  readonly id: string
  readonly text: string
  readonly level: number
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
}

export function extractHeadings(markdown: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: TocHeading[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1]!.length
    const text = match[2]!
      .replaceAll(/\*\*(.+?)\*\*/g, "$1")
      .replaceAll(/\*(.+?)\*/g, "$1")
      .replaceAll(/_(.+?)_/g, "$1")
      .replaceAll(/`(.+?)`/g, "$1")
      .replaceAll(/\[(.+?)\]\(.+?\)/g, "$1")
      .trim()

    headings.push({ id: slugify(text), text, level })
  }

  return headings
}

export const BLOG_DATE_FORMAT = "MMMM D, YYYY"
