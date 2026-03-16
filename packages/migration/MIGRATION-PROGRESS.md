# Migration Progress

## Status Legend

- **done** — dry run clean, test run succeeded, all fields populated
- **partial** — test run succeeded but some warnings remain
- **blocked** — cannot proceed (dependency or schema issue)
- **n/a** — not applicable (entity doesn't exist in v4)

## Tier 1 — Standalone Lookups

| Entity                 | Status | Total | Migrated                | Notes                                                         |
| ---------------------- | ------ | ----- | ----------------------- | ------------------------------------------------------------- |
| countries              | done   | 43    | 3 (+40 skipped/existed) |                                                               |
| cities                 | done   | 89    | 3 (+85 skipped)         | Unresolved country refs for non-migrated countries (expected) |
| tech-stacks            | done   | 34    | 1 (+31 skipped)         |                                                               |
| partner-services       | done   | 10    | 2 (+8 skipped)          |                                                               |
| case-study-categories  | done   | 6     | 2 (+4 skipped)          |                                                               |
| integration-categories | done   | 18    | 2 (+16 skipped)         |                                                               |

## Tier 2 — Blog Taxonomy

| Entity          | Status | Total | Migrated         | Notes                                                |
| --------------- | ------ | ----- | ---------------- | ---------------------------------------------------- |
| blog-categories | done   | 10    | 2 (+8 skipped)   |                                                      |
| blog-tags       | done   | 100   | 40 (+60 skipped) |                                                      |
| post-categories | done   | 10    | 9 (+1 skipped)   |                                                      |
| post-tags       | done   | 100+  | 99+              | State was reset to fix stale id-map entry for tag 87 |

## Tier 3 — Simple Entities

| Entity        | Status | Total | Migrated        | Notes                                                                                        |
| ------------- | ------ | ----- | --------------- | -------------------------------------------------------------------------------------------- |
| reviews       | done   | 13    | 3 (+1 skipped)  | author/logo media uploaded correctly                                                         |
| news-items    | done   | 25    | 21 (+4 skipped) | thumbnail media uploaded                                                                     |
| redirects     | done   | 100   | 0 (+86 skipped) | All existed in v5 already                                                                    |
| plans         | done   | 12    | 1 (+11 skipped) |                                                                                              |
| hubspot-forms | n/a    | —     | —               | v4 API returns 404; HubSpot forms embedded inline in page components, no separate collection |

## Tier 4 — Entities with Relations

| Entity       | Status | Total | Migrated        | Notes                                                                                                   |
| ------------ | ------ | ----- | --------------- | ------------------------------------------------------------------------------------------------------- |
| integrations | done   | 100+  | 25              | DZ: faq-section mapped, related-blog-posts + integration-cards-grid dropped (intentional)               |
| partners     | done   | 54    | 41 (+1 skipped) | DZ: embed-form dropped (intentional), cta-banner → section-header                                       |
| case-studies | done   | 35    | 13              | DZ: content-card, quote, video, two-column-grid; interview + related-case-studies dropped (intentional) |
| blog-posts   | done   | 100+  | 8               | Fixed stale post-tag id-map entry (v4Id=87); sections DZ mapped                                         |

## Tier 5 — CMS Entities

| Entity          | Status | Total | Migrated       | Notes                                                                    |
| --------------- | ------ | ----- | -------------- | ------------------------------------------------------------------------ |
| cms-pages       | done   | 25    | 6 (+1 skipped) | Fixed: added ensureSlug("name") for dedup. Some v4 entries missing slug. |
| cms-comparisons | done   | 100   | 78             | DZ: content-card + faq-section mapped correctly                          |

## Tier 6 — Pages

| Entity | Status | Total | Migrated       | Notes                                                                                                                                                                                            |
| ------ | ------ | ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pages  | done   | 100+  | 5 (+3 skipped) | DZ: section-header, feature-card, image, content-card, brand-logo-grid, two-column-grid, case-study-card all mapped. Drops: embed-form, stacking-cards, integration-cards-grid (all intentional) |

## Component Mapping Summary

All v4 dynamic zone components have mappings in COMPONENT_MAP. No "No mapping" warnings across any entity.

### Mapped to v5 components:

- sections.section-header (heroes, CTAs, intros)
- sections.faq-section
- sections.how-it-works
- sections.two-columns-benefits
- sections.two-column-grid (features, icon-cards, benefits)
- sections.meet-the-team
- sections.testimonies
- cards.feature-card (features-grid, text-next-to-image, various text+image combos)
- cards.content-card (text-slice, rich-text, content-cards-list)
- cards.case-study-card
- media.image
- media.image-gallery
- media.brand-logo-grid
- media.video
- testimonials.quote
- forms.newsletter
- plans.plan-pricing-cards
- plans.plan-comparison-table

### Intentionally dropped (target: null):

- Relation-based lists (related-blog-posts, related-case-studies, integration-cards-grid, etc.)
- Third-party embeds (chargebee, chili-piper, embed-form, embed-tweets, etc.)
- Layout/animation components without v5 equivalent (stacking-cards, toggle-animations, etc.)
- Deprecated sections (interview, community-section, etc.)

## Code Changes Made

1. **runner.ts**: Fixed target component stats to check `transformed["sections"]` in addition to `transformed["content"]`
2. **entities.ts**: Added `ensureSlug("name")` to cms-pages transforms for proper dedup

## Known Issues

1. **hubspot-forms**: No v4 endpoint exists. HubSpot form data must be extracted from page components or created manually.
2. **Stale id-map entries**: If v5 data is reset, id-map entries become stale. Fixed one case (post-tag 87). Consider adding id-map validation step.
3. **Stats display**: Component drop/migrate stats may undercount for entities using "sections" as DZ target field.
