# Testing Info

## 🐞 Automated Testing Suite

This directory contains an automated testing suite designed to ensure quality across functionality, accessibility, performance, and SEO. It validates the deployed or local UI through a browser.

| Area          | Tooling                                                                  | Location                        |
| ------------- | ------------------------------------------------------------------------ | ------------------------------- |
| E2E — smoke   | [Playwright](https://playwright.dev/)                                    | `qa/tests/playwright/e2e/smoke` |
| E2E — mock    | Playwright                                                               | `qa/tests/playwright/e2e/mock`  |
| Accessibility | Playwright + [axe-core](https://github.com/dequelabs/axe-core)           | `qa/tests/playwright/axe`       |
| SEO           | Playwright                                                               | `qa/tests/playwright/seo`       |
| Visual        | Playwright screenshots                                                   | `qa/tests/playwright/visual`    |
| Performance   | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/tree/main) | `qa/tests/playwright/perfo`     |

---

## 📂 Project Structure

```bash
qa/
├── tests/
│   └── playwright/                       ← Playwright-based tests (workspace package)
│       ├── e2e/
│       │   ├── smoke/                    ← Critical-path flows against the real app/backend
│       │   └── mock/                     ← Same flows, with the network layer stubbed
│       ├── axe/                          ← Accessibility tests
│       ├── seo/                          ← SEO tests
│       ├── visual/                       ← Visual regression tests + Docker scripts
│       ├── perfo/                        ← Lighthouse CI performance tests + trend history
│       ├── helpers/                      ← Shared utilities (page objects, fixtures, page lists)
│       ├── .env.example                  ← Example environment variables file
│       ├── package.json                  ← Test dependencies & scripts for this package
│       ├── playwright.config.ts          ← Playwright configuration
│       ├── tsconfig.json                 ← TypeScript configuration for this package
```

### Page lists per environment

`helpers/urls.json` holds the pages each suite checks, split by environment (`staging`, `prod`):

```json
{
  "smoke": { "staging": ["/", "/pricing-cloud", "..."], "prod": ["..."] },
  "templates": {
    "blog-post": { "staging": ["/blog/..."], "prod": ["..."] },
    "user-story": { "staging": ["/user-stories/airbus"], "prod": ["..."] }
  },
  "legal": { "staging": ["/terms-of-use", "/privacy", "..."], "prod": ["..."] },
  "seo": { "staging": ["/", "/pricing-cloud", "..."], "prod": ["..."] },
  "axe": { "staging": ["/", "/pricing-cloud", "..."], "prod": ["..."] },
  "visual": { "staging": ["/", "/pricing-cms", "..."], "prod": ["..."] },
  "perfo": { "staging": ["/"], "prod": ["/"] }
}
```

Each suite gets its full page list (every environment, deduped) via `helpers/flatten-urls.ts`. To cover a new page, add it to the right suite's list. It's picked up automatically, no spec changes needed.

- `smoke`: main pages, `templates`: one example page per page template (blog post, blog category, user story, feature, solution). Both are used by `e2e/smoke/pages.spec.ts`. When a template example is removed from the CMS, replace it with another page of the same template.
- `legal`: legal pages, checked in detail by `e2e/smoke/legal.spec.ts`.
- Use the final URL of a page, not one that redirects (e.g. `/pricing-cloud`, not `/pricing`). Leave out pages that redirect to `community.strapi.io` (e.g. `/integrations`) - they aren't served by this repo.

### E2E: smoke vs mock

Both kinds share the same page objects from `helpers/pages/` (one Page Object Model class per page).

**`e2e/smoke/`** drives a real browser against the real running app and its real backend:

- `pages.spec.ts`: every main and template page returns a non-error status, renders its main content, and throws no uncaught browser errors (e.g. a crashing client component). The navbar and footer aren't checked here, because some pages intentionally have a different one or none.
- `homepage.spec.ts`: the main navbar (with links) and the main footer.
- `blog.spec.ts`: category navigation, the featured post, the post list (each post with a title and a publish date), "Load More Articles" and opening a post.
- `pricing-cloud.spec.ts`: plan cards with sign-up links, the comparison table, the monthly/yearly billing switch.
- `pricing-cms.spec.ts`: the Growth checkout dialog - seats, totals, the SSO add-on, cancelling.
- `legal.spec.ts`: each legal page has a title, the full text (word count, sections, paragraphs), no placeholders, and a valid effective date if it states one.

**`e2e/mock/`** drives the browser the same way, but stubs network responses with [Playwright's route mocking](https://playwright.dev/docs/mock). Use it for backend states that are hard to reproduce for real. Mock specs import `mockTest as test` from `helpers/fixtures.ts`.

- `media-failure.spec.ts`: every image request returns 404 - the page must still render and not crash.
- `pricing-checkout.spec.ts`: Chargebee's hosted checkout is stubbed, so no real checkout session is opened. Checks the plan, extra seats and SSO the app sends to Chargebee.
- `preview-refresh.spec.ts`: a stubbed Strapi admin window embeds the page in an iframe. The page must announce itself (`previewReady`), refresh on a `strapiUpdate` message from the Strapi origin, and ignore it from any other origin. Needs `STRAPI_URL` (see below), otherwise it's skipped.

### Writing tests

- **Don't assert CMS-managed content.** Page copy, blog posts, prices, legal texts and button labels set in Strapi change often. Check the shape instead (counts, formats, "not empty"), and locate CMS-labelled elements by role or target, not by their text. UI copy from `apps/ui/locales/en.json` is fine to use.
- **Wait for hydration, not "networkidle".** Deployed pages keep loading in the background (analytics, polling), so they may never reach "networkidle". Page objects wait with `waitForHydration` (`helpers/hydration.ts`) instead. Parts of a page can hydrate later than the rest - before clicking those, wait with `waitForElementHydration`, otherwise the click does nothing.
- **Known non-breaking browser errors** (e.g. React hydration mismatches, #418) are listed in `helpers/page-errors.ts`. They don't fail tests, but show up as a warning on the test in the HTML report.
- **The cookie consent banner** is closed up front: `playwright.config.ts` sets Cookiebot's consent cookie (necessary cookies only) for the `BASE_URL` host via `helpers/cookie-consent.ts`.

---

## Playwright

### 🔧 Environment Variables

Playwright tests require a `.env` file.

1. Copy the example file:
   ```bash
   cp qa/tests/playwright/.env.example qa/tests/playwright/.env
   ```
2. Update the `BASE_URL` value to point to the environment you want to test.
   ```bash
   BASE_URL=http://localhost:3000
   ```
   `BASE_URL` defines the base URL of the application under test and is used as the starting point for all suites.

### 🌎 Install Playwright Browsers

Before running tests for the first time, install the required browsers:

```bash
# From project root
pnpm -F @repo/tests-playwright exec playwright install --with-deps

# Or from the playwright directory
cd qa/tests/playwright && pnpm exec playwright install --with-deps
```

### 📱 Mobile Viewport Testing

Mobile browser projects (Pixel 7, iPhone 15) are disabled by default. Enable them for E2E runs via:

```env
MOBILE_VIEWPORTS_TESTING_ENABLED=true
```

### 🧩 Strapi URL for the preview mock test

Set `STRAPI_URL` to the Strapi URL the app under test is configured with. Only `e2e/mock/preview-refresh.spec.ts` uses it, and it's skipped when the variable is empty (also in CI).

```env
STRAPI_URL=https://cms.example.com
```

### ▶️ Running Tests

All commands are run from the **project root**:

```bash
pnpm tests:playwright:e2e:test              # E2E, headless (smoke + mock)
pnpm tests:playwright:e2e:smoke             # E2E, smoke only
pnpm tests:playwright:e2e:mock              # E2E, mock only
pnpm tests:playwright:e2e:test:interactive  # E2E, UI mode
pnpm tests:playwright:axe                   # Accessibility checks
pnpm tests:playwright:seo                   # SEO checks
pnpm tests:playwright:visual                # Visual regression checks
pnpm tests:playwright:visual:update         # Update visual snapshots (local OS)
pnpm tests:playwright:visual:docker         # Visual regression checks via Docker (CI-compatible)
pnpm tests:playwright:visual:docker:update  # Update Linux snapshots via Docker
pnpm tests:lhci:perfo                       # Lighthouse CI performance checks
```

Each suite runs as its own Playwright project:

- **E2E:** `chromium` runs every spec. `firefox`, `webkit` (and the optional mobile projects) only run `pages.spec.ts` and `homepage.spec.ts` - page loads and the main layout, where browser differences actually show up. Content checks, interactions and mocks behave the same in every browser. Set `E2E_ALL_BROWSERS=true` to run every E2E spec in every browser.
- **Axe and SEO:** Chromium only.
- **Visual:** `visual-chromium`, `visual-firefox` and `visual-webkit` (WebKit locally only).

---

## ♿ Accessibility Tests

`axe/axe.spec.ts` runs axe-core via `@axe-core/playwright`, one test per page from `helpers/urls.json`. Any violation fails the test, unless it's configured as a warning:

- A known, not-fixed-today violation on a specific page → add its rule ID to that page's `warningRuleIds` in `PATH_CONFIGS`.
- An element axe should ignore entirely on a page → that page's `excludeSelectors`.
- A violation that applies everywhere → `GLOBAL_WARNING_RULE_IDS` / `GLOBAL_EXCLUDE_SELECTORS`.

## 🔍 SEO Tests

`seo/seo.spec.ts` checks title, meta description, robots, canonical URL, H1 and heading hierarchy, structured data (JSON-LD), Open Graph tags and hreflang, one `test.describe` block per page from `helpers/urls.json`.

The robots `noindex` check runs only when `BASE_URL` points to production (`strapi.io`). Other environments render `noindex` on purpose, so it skips itself there.

## 📸 Visual Regression Tests

Visual tests compare full-page screenshots against committed baseline images.

| Browser         | Local | Docker / CI |
| --------------- | ----- | ----------- |
| Chromium        | ✅    | ✅          |
| Firefox         | ✅    | ✅          |
| WebKit (Safari) | ✅    | ❌          |

WebKit on Linux produces blank or incorrectly rendered screenshots, so it runs locally on macOS only.

**Baselines must be generated on Linux.** macOS and Linux render fonts differently, so snapshots made locally would fail on CI. Only `linux` snapshots are committed; `darwin` ones are gitignored.

The `visual` list in `helpers/urls.json` holds stable key pages only (homepage, CMS pricing, enterprise, cloud, AI, terms of use). Pages whose content changes often - like the blog listing or Cloud prices - would produce a visual diff on every content update, so they're left out. Screenshots are taken with scripts blocked (server-rendered HTML only) and with images hidden, so third-party widgets and media changes don't cause diffs.

Baselines are committed for **prod** (`strapi-io-*`). Staging gets its own set once it's generated for it.

Snapshot names encode the environment and page: `{env-slug}-{page}-{browser}.png`, where `env-slug` comes from the `BASE_URL` hostname. Each environment keeps its own baselines. The first run on an environment creates the baselines and passes; failures only happen on later runs when something changed visually.

**Workflow:**

1. Generate Linux baselines locally (requires Docker Desktop running):
   ```bash
   pnpm tests:playwright:visual:docker:update
   ```
2. Review the new files in `qa/tests/playwright/visual/visual.spec.ts-snapshots/linux/`, then commit them with the related UI change.
3. Optionally verify the comparison locally before pushing:
   ```bash
   pnpm tests:playwright:visual:docker
   ```

## ⚡ Lighthouse Performance Tests

`pnpm tests:lhci:perfo` runs `lhci collect` against every URL in the `perfo` list of `helpers/urls.json`. Raw reports go to `qa/tests/playwright/perfo/.lighthouseci/` (gitignored).

Each run also appends its category scores (performance, accessibility, best practices, SEO) to `qa/tests/playwright/perfo/lighthouse-history.md`, which is committed. It has one `## <url>` section per page, so a page's trend stays together.

---

## 🤖 CI (GitHub Actions)

`.github/workflows/qa.yml` runs:

- **Nightly** at 00:00 UTC (02:00 Prague in summer, 01:00 in winter): E2E, Axe, SEO and Visual against the `BASE_URL` repository variable, or `https://strapi.io` when it isn't set. Lighthouse is manual-only. Scheduled runs only start from the default branch (`main`), so the schedule becomes active once this workflow is merged there.
- **Manually:** **Actions → QA → Run workflow**. Pick the branch, check the suites to run (E2E, AXE, SEO, LHCI Performance, Visual) and optionally set `base_url`. An empty `base_url` falls back to the `BASE_URL` repository variable, then to `https://strapi.io`.

- Jobs run in parallel. E2E and visual reports and traces are uploaded as artifacts on failure. Axe, SEO and Lighthouse reports are uploaded on both passing and failing runs.
- **E2E runs as one job per browser** (Chromium, Firefox, WebKit). Each job gets its own runner and IP, which keeps it under the CDN bot protection limit (~70-80 page loads per IP before HTTP 403). Reports are uploaded per browser (`playwright-report-chromium`, ...). Once the CDN bypass for QA runs exists, this can go back to a single job.
- **Axe and SEO soft-fail:** their findings don't fail the job or the run. Failing checks show up as annotations on the run, the job summary gets a warning, and the HTML report is uploaded as the `axe-report` / `seo-report` artifact. Locally, the suites still fail normally.
- The visual job runs in the Playwright Docker image and skips itself when no baseline snapshots are committed.
- On success, the Lighthouse job opens (or updates) a PR with the updated `lighthouse-history.md`. This needs **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** enabled.
