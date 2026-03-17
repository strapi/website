/**
 * Plan-specific migration notes.
 *
 * v4 Plan schema has many fields not in v5:
 *   theme, media, link, plans_features (relation), plans_custom_features,
 *   specialOffer, billedAnnually, oldAnnualPrice, newAnnualPrice, priority,
 *   freeTrial, freeTrialText, commandLine, chargebee_id, tooltip, text
 *
 * v5 Plan schema:
 *   name, type (cms|cloud), price, subtext, yearlyPrice, features (repeatable component)
 *
 * The v4 plans_features relation is a manyToMany to a separate collection.
 * The v5 features field is a repeatable component (plans.plan-feature-value).
 * This transformation needs custom logic if we want to map features across.
 *
 * For now, basic fields are mapped. Features will need manual curation
 * or a separate migration pass once we understand the feature mapping.
 */

export const PLAN_MIGRATION_NOTES = `
v4 → v5 Plan mapping:
  name → name
  price → price
  subtext → subtext
  type (inferred from chargebee_id or manual) → type (cms|cloud)
  features: v4 uses relations, v5 uses repeatable components — needs manual mapping
`
