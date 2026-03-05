import type { TransformFn } from "./base.ts"

/**
 * Drop fields that shouldn't be sent to v5.
 */
export function dropFields(...fields: string[]): TransformFn {
  return (entity) => {
    const result = { ...entity }

    for (const field of fields) {
      delete result[field]
    }

    return result
  }
}

/**
 * Rename fields from v4 names to v5 names.
 */
export function renameFields(fieldMap: Record<string, string>): TransformFn {
  return (entity) => {
    const result = { ...entity }

    for (const [from, to] of Object.entries(fieldMap)) {
      if (from in result) {
        result[to] = result[from]
        delete result[from]
      }
    }

    return result
  }
}

/**
 * Keep only specified fields, drop everything else.
 */
export function pickFields(...fields: string[]): TransformFn {
  return (entity) => {
    const result: Record<string, unknown> = {}

    for (const field of fields) {
      if (field in entity) {
        result[field] = entity[field]
      }
    }

    return result
  }
}
