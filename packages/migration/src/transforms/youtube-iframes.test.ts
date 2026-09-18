import assert from "node:assert/strict"
import { test } from "node:test"

import { rewriteYouTubeIframes } from "./youtube-iframes.ts"

const ID = "dQw4w9WgXcQ"
const EXPECTED = `[https://www.youtube.com/watch?v=${ID}](https://www.youtube.com/watch?v=${ID})`

test("rewrites youtube.com/embed iframe", () => {
  const { text, count } = rewriteYouTubeIframes(
    `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`
  )

  assert.equal(count, 1)
  assert.equal(text.trim(), EXPECTED)
  assert.doesNotMatch(text, /<iframe/i)
  assert.doesNotMatch(text, /<p>/i)
})

test("rewrites youtube-nocookie embed to watch URL", () => {
  const { text, count } = rewriteYouTubeIframes(
    `<iframe src="https://www.youtube-nocookie.com/embed/${ID}?si=abc"></iframe>`
  )

  assert.equal(count, 1)
  assert.equal(text.trim(), EXPECTED)
  assert.doesNotMatch(text, /nocookie/)
})

test("unwraps wrapping <p> so the link is a real markdown paragraph", () => {
  const { text, count } = rewriteYouTubeIframes(
    `<p><iframe width="560" height="315" src="https://www.youtube.com/embed/${ID}" title="YouTube video player" frameborder="0" allowfullscreen></iframe></p>`
  )

  assert.equal(count, 1)
  assert.equal(text.trim(), EXPECTED)
  assert.doesNotMatch(text, /<p[\s>]/i)
})

test("strips query params from embed src", () => {
  const { text, count } = rewriteYouTubeIframes(
    `<iframe src="https://www.youtube.com/embed/${ID}?rel=0&amp;start=12"></iframe>`
  )

  assert.equal(count, 1)
  assert.equal(text.trim(), EXPECTED)
})

test("rewrites two YouTube iframes independently", () => {
  const other = "jNQXAC9IVRw"
  const { text, count } = rewriteYouTubeIframes(
    [
      `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
      `<iframe src="https://youtu.be/${other}"></iframe>`,
    ].join("\n")
  )

  assert.equal(count, 2)
  assert.match(
    text,
    new RegExp(
      String.raw`\[https://www\.youtube\.com/watch\?v=${ID}\]\(https://www\.youtube\.com/watch\?v=${ID}\)`
    )
  )
  assert.match(
    text,
    new RegExp(
      String.raw`\[https://www\.youtube\.com/watch\?v=${other}\]\(https://www\.youtube\.com/watch\?v=${other}\)`
    )
  )
})

test("leaves non-YouTube iframes untouched", () => {
  const luma = `<iframe src="https://lu.ma/embed/calendar/cal-xxx/events"></iframe>`
  const { text, count } = rewriteYouTubeIframes(luma)

  assert.equal(count, 0)
  assert.equal(text, luma)
})

test("rewrites YouTube iframe and leaves a sibling lu.ma iframe", () => {
  const luma = `<iframe src="https://lu.ma/embed/calendar/cal-xxx/events"></iframe>`
  const input = `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>\n${luma}`
  const { text, count } = rewriteYouTubeIframes(input)

  assert.equal(count, 1)
  assert.ok(text.includes(EXPECTED))
  assert.match(text, /lu\.ma/)
})
