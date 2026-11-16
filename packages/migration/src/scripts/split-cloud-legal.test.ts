import assert from "node:assert/strict"
import { test } from "node:test"

import {
  assertLocalTarget,
  findLongestProse,
  splitLegalDocument,
  wordCount,
} from "./split-cloud-legal.ts"

const SAMPLE = `Intro note.

# Terms of Service

The terms apply to everyone.

## Fees

Fees are monthly.

# Policies

Be fair.

# Service Levels

Uptime is measured.
`

test("keeps the first heading on the host and links the rest", () => {
  const split = splitLegalDocument(SAMPLE)

  assert.ok(split)
  assert.equal(split.host.title, "Terms of Service")
  assert.equal(split.host.slug, "terms-of-service")
  assert.match(split.host.content, /^Intro note/)
  assert.match(split.host.content, /## Fees/)
  assert.equal(split.legalPages.length, 2)
  assert.deepEqual(
    split.legalPages.map((page) => page.slug),
    ["policies", "service-levels"]
  )
  assert.equal(split.legalPages[0]?.title, "Policies")
  assert.doesNotMatch(split.legalPages[0]?.content ?? "", /Service Levels/)
})

test("splits HTML h1 headings and ignores h2", () => {
  const split = splitLegalDocument(
    "<h2>Not a page</h2><h1>Cloud Policies</h1><p>Policy text.</p><h1>Service Levels</h1><p>Uptime.</p>"
  )

  assert.ok(split)
  assert.equal(split.host.title, "Cloud Policies")
  assert.equal(split.legalPages.length, 1)
  assert.equal(split.legalPages[0]?.slug, "service-levels")
})

test("ignores markdown headings inside fences", () => {
  const split = splitLegalDocument(
    "# Real\n\n```\n# Not a page\n```\n\n# Also real\n"
  )

  assert.ok(split)
  assert.equal(split.legalPages.length, 1)
  assert.equal(split.legalPages[0]?.title, "Also real")
})

test("suffixes duplicate slugs", () => {
  const split = splitLegalDocument("# Policies\n\nOne.\n\n# Policies\n\nTwo.\n")

  assert.ok(split)
  assert.equal(split.host.slug, "policies")
  assert.equal(split.legalPages[0]?.slug, "policies-2")
})

test("returns null when there is no top-level heading", () => {
  assert.equal(splitLegalDocument("## Only a subsection\n\nText."), null)
})

test("finds the longest heading-bearing string in a nested payload", () => {
  const prose = findLongestProse({
    attributes: {
      title: "# Short",
      slices: [{ text: "# Terms\n\nA longer body.\n\n# Policies\n\nMore." }],
    },
  })

  assert.equal(prose, "# Terms\n\nA longer body.\n\n# Policies\n\nMore.")
  assert.equal(wordCount(prose ?? ""), 8)
})

test("refuses a remote target and allows loopback", () => {
  assert.throws(
    () => assertLocalTarget("https://api-prod.strapi.io"),
    /Refusing to run/
  )
  assert.doesNotThrow(() => assertLocalTarget("http://127.0.0.1:1337"))
  assert.doesNotThrow(() => assertLocalTarget("http://localhost:1337"))
})
