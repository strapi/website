/**
 * Patches @strapi-community/provider-rest-cache-memory for ESM/CJS compatibility.
 * See: https://github.com/strapi-community/plugin-rest-cache/issues/116
 *
 * Can be removed once the upstream fixes the `require('keyv').default` issue.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

let filePath
try {
  const resolved =
    require.resolve("@strapi-community/provider-rest-cache-memory/lib/MemoryCacheProvider.js")
  filePath = resolved
} catch {
  // Provider not installed — skip silently
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0)
}

const content = readFileSync(filePath, "utf8")
// keyv@5.x exports { Keyv, default } — the original `.default` doesn't work, and bare require returns an object
const patched = content
  .replace(
    "const Keyv = require('keyv').default;",
    "const Keyv = require('keyv').Keyv;"
  )
  .replace(
    "const Keyv = require('keyv');",
    "const Keyv = require('keyv').Keyv;"
  )

if (content !== patched) {
  writeFileSync(filePath, patched)
  console.log(
    "[patch-rest-cache] Patched MemoryCacheProvider.js (keyv@5 import fix)"
  )
} else {
  console.log(
    "[patch-rest-cache] No patch needed — already fixed or different version"
  )
}
