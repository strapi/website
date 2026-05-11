/* eslint-disable no-console */
/**
 * Attach a placeholder icon to every feature row (draft + published).
 *
 * Looked up by `hash` in the `files` table — the upload-plugin hash is stable
 * per environment. Override `PLACEHOLDER_ICON_HASH` (or the env var) before
 * running this migration in a new environment where the icon was uploaded with
 * a different filename.
 *
 * Idempotent: skips features that already have an icon morph row.
 */

"use strict"

const FILES_TABLE = "files"
const FILES_MORPH_TABLE = "files_related_mph"
const FEATURES_TABLE = "features"
const FEATURE_UID = "api::feature.feature"

const PLACEHOLDER_ICON_HASH = "Layout_2d5ef707ac"

async function loadPlaceholderIconId(knex) {
  const row = await knex(FILES_TABLE)
    .where({ hash: PLACEHOLDER_ICON_HASH })
    .first("id")

  if (!row) {
    console.log(
      `[seed-feature-icons] placeholder icon (hash ${PLACEHOLDER_ICON_HASH}) not found in ${FILES_TABLE}, skipping`
    )

    return null
  }

  return row.id
}

async function loadFeaturesMissingIcon(knex) {
  return knex(FEATURES_TABLE)
    .leftJoin(FILES_MORPH_TABLE, function joinIcon() {
      this.on(`${FILES_MORPH_TABLE}.related_id`, "=", `${FEATURES_TABLE}.id`)
        .andOnVal(`${FILES_MORPH_TABLE}.related_type`, "=", FEATURE_UID)
        .andOnVal(`${FILES_MORPH_TABLE}.field`, "=", "icon")
    })
    .whereNull(`${FILES_MORPH_TABLE}.id`)
    .select(`${FEATURES_TABLE}.id`)
}

module.exports = {
  async up(knex) {
    const iconFileId = await loadPlaceholderIconId(knex)
    if (!iconFileId) return

    const missing = await loadFeaturesMissingIcon(knex)

    if (missing.length === 0) {
      console.log(`[seed-feature-icons] every feature already has an icon`)

      return
    }

    const rows = missing.map((f) => ({
      file_id: iconFileId,
      related_id: f.id,
      related_type: FEATURE_UID,
      field: "icon",
      order: 1,
    }))

    await knex(FILES_MORPH_TABLE).insert(rows)

    console.log(
      `[seed-feature-icons] attached placeholder icon to ${rows.length} feature row(s)`
    )
  },

  async down() {
    throw new Error(
      "Irreversible: placeholder icon morph rows are intentionally left in place"
    )
  },
}
