import type React from "react"

import { slugify } from "@/lib/blog-utils"

/**
 * Recursively extracts plain text from React children nodes.
 */
export function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string") {
    return node
  }

  if (typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("")
  }

  if (node && typeof node === "object" && "props" in node) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>

    return getTextContent(el.props.children)
  }

  return ""
}

/**
 * Generates a slugified ID from heading children for TOC anchoring.
 */
export function headingId(children: React.ReactNode): string {
  return slugify(getTextContent(children))
}
