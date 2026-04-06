import "server-only"

import bash from "@shikijs/langs/bash"
import cssLang from "@shikijs/langs/css"
import dart from "@shikijs/langs/dart"
import html from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import jsx from "@shikijs/langs/jsx"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import githubDarkDefault from "@shikijs/themes/github-dark-default"
import { createHighlighterCoreSync } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  zsh: "bash",
}

const LANGUAGES_WITHOUT_LINE_NUMBERS = new Set(["bash", "sh", "zsh"])

const DEFAULT_LANGUAGE = "javascript"
const DEFAULT_THEME = "github-dark-default"

/**
 * Synchronous highlighter singleton.
 * Created once at module load time — runs only on the server.
 */
const highlighter = createHighlighterCoreSync({
  themes: [githubDarkDefault],
  langs: [javascript, jsx, typescript, tsx, bash, json, cssLang, html, dart],
  engine: createJavaScriptRegexEngine(),
})

const loadedLangs = new Set(highlighter.getLoadedLanguages())

export function resolveLanguage(lang: string | undefined): string {
  if (!lang) return DEFAULT_LANGUAGE

  const resolved = LANGUAGE_ALIASES[lang] || lang

  return loadedLangs.has(resolved) ? resolved : "text"
}

function shouldShowLineNumbers(lang: string | undefined): boolean {
  return !LANGUAGES_WITHOUT_LINE_NUMBERS.has(lang ?? "")
}

export function highlightCode(code: string, language?: string): string {
  const lang = resolveLanguage(language)

  let html = highlighter.codeToHtml(code, {
    lang,
    theme: DEFAULT_THEME,
  })

  if (shouldShowLineNumbers(language)) {
    html = html.replace('<pre class="shiki', '<pre class="shiki line-numbers')
  }

  return html
}
