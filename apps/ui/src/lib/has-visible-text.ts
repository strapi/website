import type { ReactNode } from "react"

export function hasVisibleText(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === "boolean") {
    return false
  }

  if (typeof node === "string") {
    return node.trim().length > 0
  }

  if (typeof node === "number") {
    return true
  }

  if (Array.isArray(node)) {
    return node.some(hasVisibleText)
  }

  return true
}
