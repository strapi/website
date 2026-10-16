import fs from "node:fs"
import path from "node:path"

import { defineConfig, devices, type Project } from "@playwright/test"
import dotenv from "dotenv"

import { normalizeBaseUrl } from "./helpers/base-url"
import { cookieConsentStorageState } from "./helpers/cookie-consent"

const envPath = path.resolve(__dirname, ".env")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false })
}

// Accepts BASE_URL with or without a protocol ("strapi.io" works too). Written
// back to the env, so specs and test workers reading it get the same value.
const baseUrl = normalizeBaseUrl(process.env.BASE_URL)

if (baseUrl) {
  process.env.BASE_URL = baseUrl
}

const mobileViewportsEnabled =
  process.env.MOBILE_VIEWPORTS_TESTING_ENABLED === "true"

const baseProjects: Project[] = [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "webkit",
    use: {
      ...devices["Desktop Safari"],
      // Desktop Safari defaults to deviceScaleFactor: 2, overriding to match Chromium/Firefox
      deviceScaleFactor: 1,
    },
  },
]

const mobileProjects: Project[] = mobileViewportsEnabled
  ? [
      // Android
      {
        name: "Mobile Chrome (Pixel 7)",
        use: { ...devices["Pixel 7"] },
      },
      // iOS
      {
        name: "Mobile Safari (iPhone 15)",
        use: { ...devices["iPhone 15"] },
      },
    ]
  : []

const specializedProjects: Project[] = [
  {
    name: "visual-chromium",
    testMatch: ["visual/**/*.spec.ts"],
    retries: 0,
    use: {
      ...devices["Desktop Chrome"],
      trace: "off",
      video: "off",
      screenshot: "off",
    },
  },
  {
    name: "visual-firefox",
    testMatch: ["visual/**/*.spec.ts"],
    retries: 0,
    use: {
      ...devices["Desktop Firefox"],
      trace: "off",
      video: "off",
      screenshot: "off",
    },
  },
  {
    name: "visual-webkit",
    testMatch: ["visual/**/*.spec.ts"],
    retries: 0,
    use: {
      ...devices["Desktop Safari"],
      deviceScaleFactor: 1,
      trace: "off",
      video: "off",
      screenshot: "off",
    },
  },
  {
    name: "seo",
    testMatch: ["seo/**/*.spec.ts"],
    retries: 1,
    use: {
      ...devices["Desktop Chrome"],
      trace: "off",
      screenshot: "off",
      video: "off",
    },
  },
  {
    name: "axe",
    testMatch: ["axe/**/*.spec.ts"],
    workers: 1,
    retries: 1,
    use: {
      ...devices["Desktop Chrome"],
      trace: "off",
      screenshot: "off",
      video: "off",
    },
  },
]

// Browser projects run only e2e specs - axe, seo and visual have their own
// projects above, so a plain `playwright test` doesn't run them per browser.
const ALL_E2E_SPECS = ["e2e/**/*.spec.ts"]

// Chromium runs every e2e spec. The other browsers (incl. mobile) only run the
// specs where browser differences actually show up - page loads and the main
// layout. Content checks, interactions and mocks behave the same everywhere.
// E2E_ALL_BROWSERS=true runs every e2e spec in every browser.
const CROSS_BROWSER_SPECS =
  process.env.E2E_ALL_BROWSERS === "true"
    ? ALL_E2E_SPECS
    : ["e2e/smoke/pages.spec.ts", "e2e/smoke/homepage.spec.ts"]

const e2eProjects: Project[] = [...baseProjects, ...mobileProjects].map(
  (project) => ({
    ...project,
    testMatch:
      project.name === "chromium" ? ALL_E2E_SPECS : CROSS_BROWSER_SPECS,
  })
)

const projects: Project[] = [...e2eProjects, ...specializedProjects]

export default defineConfig({
  testDir: ".",
  snapshotPathTemplate:
    "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{platform}/{arg}{-projectName}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // strapi.io's CDN bot protection blocks bursts of automated requests (HTTP
  // 403), so CI runs gently: one worker, one retry (a blocked page retried
  // twice just adds requests and deepens the block).
  // TODO: once the CDN bypass header for QA runs is in place (dev ticket),
  // switch CI back to `retries: 2` and `workers: 2` (or more).
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  // In CI, the github reporter also shows every failing test as an annotation
  // on the workflow run - visible without downloading the HTML report
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL: baseUrl,
    // Closes the cookie consent banner up front (necessary cookies only)
    storageState: cookieConsentStorageState(baseUrl),

    // Uncomment if credentials are needed
    // httpCredentials: {
    //   username: "xx",
    //   password: "yyy",
    // },

    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects,
})
