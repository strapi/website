/* eslint-disable no-console */
/**
 * Reshape SEO component from `seo-utilities.seo` (with typed `og` + `twitter` subcomponents)
 * to plugin-canonical `shared.seo` (with repeatable `metaSocial`).
 *
 * og/twitter subcomponents are *transformed* into Facebook/Twitter entries in the
 * repeatable metaSocial component — title + description are copied; og.image and the
 * first twitter image (by order) are rebound into metaSocial.image via morph rewrite.
 * og/twitter fields that have no metaSocial equivalent (url, type, siteName, card,
 * siteId, creator, creatorId, extra twitter images) are dropped.
 *
 * All top-level seo fields (metaTitle, metaDescription, metaImage, keywords, metaRobots,
 * canonicalURL, structuredData) are preserved via table rename.
 *
 * Every step is idempotent, so the migration can be re-run safely to clean up state left
 * behind by earlier broken versions of this file (e.g. `application_name` cruft, morphs
 * with the old parent UID). The og/twitter transform only runs while OLD_OG/OLD_TW
 * tables still exist — if a previous broken run dropped them, subcomponent data is
 * already gone and cannot be recovered here.
 *
 * Irreversible: down() throws.
 */

"use strict"

const OLD_SEO = "components_seo_utilities_seos"
const OLD_OG = "components_seo_utilities_seo_ogs"
const OLD_TW = "components_seo_utilities_seo_twitters"
const OLD_CMPS = "components_seo_utilities_seos_cmps"

const NEW_SEO = "components_shared_seos"
const NEW_CMPS = "components_shared_seos_cmps"
const NEW_META_SOCIAL = "components_shared_meta_socials"

const OLD_SEO_UID = "seo-utilities.seo"
const OLD_OG_UID = "seo-utilities.seo-og"
const OLD_TW_UID = "seo-utilities.seo-twitter"
const NEW_SEO_UID = "shared.seo"

async function listParentCmpsTables(knex) {
  const res = await knex.raw(String.raw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name LIKE '%_cmps'
      AND table_name NOT LIKE 'components\_%' ESCAPE '\'
  `)

  return res.rows.map((r) => r.table_name)
}

// Strapi 5 uses `files_related_mph`; older schemas may still have `files_related_morphs`.
async function resolveMorphTable(knex) {
  for (const candidate of ["files_related_mph", "files_related_morphs"]) {
    if (await knex.schema.hasTable(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Transform each og/twitter subcomponent into a metaSocial entry on its parent SEO row.
 *   - socialNetwork = Facebook (og) or Twitter (tw)
 *   - title/description copied as-is
 *   - og.image -> metaSocial.image via morph rebind
 *   - first twitter image (by order) -> metaSocial.image; extras are dropped
 *   - rows with no title, no description and no image are skipped (nothing to preserve)
 *   - link row in {NEW_CMPS} is rewritten to point at the new metaSocial (component_type
 *     'shared.meta-social', field 'metaSocial', order 1 for FB / 2 for Twitter)
 */
async function transformOgTwitterToMetaSocial(knex, morphTable) {
  const hasOg = await knex.schema.hasTable(OLD_OG)
  const hasTw = await knex.schema.hasTable(OLD_TW)

  if (!hasOg && !hasTw) {
    console.log(`[seo-reshape] og/twitter tables gone, skipping transform`)

    return
  }

  const variants = []

  if (hasOg) {
    variants.push({
      uid: OLD_OG_UID,
      table: OLD_OG,
      network: "Facebook",
      order: 1,
      multiField: null,
      singleField: "image",
    })
  }

  if (hasTw) {
    variants.push({
      uid: OLD_TW_UID,
      table: OLD_TW,
      network: "Twitter",
      order: 2,
      multiField: "images",
      singleField: null,
    })
  }

  let transformed = 0
  let imagesRebound = 0

  for (const v of variants) {
    const links = await knex(NEW_CMPS)
      .where({ component_type: v.uid })
      .select("id", "entity_id", "cmp_id", "field", "order")

    for (const link of links) {
      const sub = await knex(v.table).where({ id: link.cmp_id }).first()
      const title = sub?.title ?? null
      const description = sub?.description ?? null

      const imageMorph = morphTable
        ? await knex(morphTable)
            .where({
              related_type: v.uid,
              related_id: link.cmp_id,
              ...(v.singleField ? { field: v.singleField } : {}),
              ...(v.multiField ? { field: v.multiField } : {}),
            })
            .orderBy("order", "asc")
            .select("id", "file_id", "order")
        : []

      const hasAny = title || description || imageMorph.length > 0

      if (!hasAny) {
        continue
      }

      const [inserted] = await knex(NEW_META_SOCIAL)
        .insert({
          social_network: v.network,
          title,
          description,
        })
        .returning("id")

      const newMetaSocialId =
        typeof inserted === "object" ? inserted.id : inserted

      // Keep first image (by order), delete the rest for Twitter multi.
      if (imageMorph.length > 0) {
        const [keep, ...rest] = imageMorph

        await knex(morphTable).where({ id: keep.id }).update({
          related_type: "shared.meta-social",
          related_id: newMetaSocialId,
          field: "image",
          order: 1,
        })

        imagesRebound += 1

        if (rest.length > 0) {
          await knex(morphTable)
            .whereIn(
              "id",
              rest.map((r) => r.id)
            )
            .del()
        }
      }

      await knex(NEW_CMPS).where({ id: link.id }).update({
        cmp_id: newMetaSocialId,
        component_type: "shared.meta-social",
        field: "metaSocial",
        order: v.order,
      })

      transformed += 1
    }
  }

  console.log(
    `[seo-reshape] transformed ${transformed} og/twitter subcomponents into metaSocial entries (${imagesRebound} images rebound)`
  )
}

module.exports = {
  async up(knex) {
    const hasOld = await knex.schema.hasTable(OLD_SEO)
    const hasNew = await knex.schema.hasTable(NEW_SEO)

    if (!hasOld && !hasNew) {
      console.log("[seo-reshape] fresh install, nothing to migrate")

      return
    }

    console.log("[seo-reshape] starting SEO component reshape (idempotent)")

    // 1. Rename main table.
    if (hasOld && !hasNew) {
      await knex.schema.renameTable(OLD_SEO, NEW_SEO)
      console.log(`[seo-reshape] renamed ${OLD_SEO} -> ${NEW_SEO}`)
    }

    // 2. Add meta_viewport column.
    if (!(await knex.schema.hasColumn(NEW_SEO, "meta_viewport"))) {
      await knex.schema.alterTable(NEW_SEO, (t) => {
        t.string("meta_viewport").nullable()
      })
      console.log(`[seo-reshape] added meta_viewport column`)
    }

    // 3. Drop obsolete columns.
    for (const col of ["application_name"]) {
      if (await knex.schema.hasColumn(NEW_SEO, col)) {
        await knex.schema.alterTable(NEW_SEO, (t) => t.dropColumn(col))
        console.log(`[seo-reshape] dropped obsolete column ${col}`)
      }
    }

    // 4. Create empty meta_social table.
    if (!(await knex.schema.hasTable(NEW_META_SOCIAL))) {
      await knex.schema.createTable(NEW_META_SOCIAL, (t) => {
        t.increments("id").primary()
        t.string("social_network")
        t.string("title")
        t.string("description")
      })
      console.log(`[seo-reshape] created ${NEW_META_SOCIAL}`)
    }

    // 5. Rename/create cmps table.
    if (await knex.schema.hasTable(OLD_CMPS)) {
      await knex.schema.renameTable(OLD_CMPS, NEW_CMPS)
      console.log(`[seo-reshape] renamed ${OLD_CMPS} -> ${NEW_CMPS}`)
    } else if (!(await knex.schema.hasTable(NEW_CMPS))) {
      await knex.schema.createTable(NEW_CMPS, (t) => {
        t.increments("id").primary()
        t.integer("entity_id")
        t.integer("cmp_id")
        t.string("component_type")
        t.string("field")
        t.float("order")
      })
      console.log(`[seo-reshape] created ${NEW_CMPS}`)
    }

    // 6. Rewrite polymorphic component_type references in parent CT link tables
    //    (seo-utilities.seo -> shared.seo).
    const parentTables = await listParentCmpsTables(knex)
    let rewritten = 0

    for (const tbl of parentTables) {
      const updated = await knex(tbl)
        .where({ component_type: OLD_SEO_UID })
        .update({ component_type: NEW_SEO_UID })

      if (updated > 0) {
        console.log(`[seo-reshape] rewrote ${updated} rows in ${tbl}`)
        rewritten += updated
      }
    }
    console.log(`[seo-reshape] total parent link rows rewritten: ${rewritten}`)

    // 7. Rewrite metaImage morph rows — their `related_type` stored the old parent
    //    component UID, which must follow the rename.
    const morphTable = await resolveMorphTable(knex)

    if (morphTable) {
      const rewrittenMorphs = await knex(morphTable)
        .where({ related_type: OLD_SEO_UID })
        .update({ related_type: NEW_SEO_UID })

      if (rewrittenMorphs > 0) {
        console.log(
          `[seo-reshape] rewrote ${rewrittenMorphs} metaImage morph rows in ${morphTable}`
        )
      }
    } else {
      console.log(
        `[seo-reshape] no morph table found, skipping metaImage rewrite`
      )
    }

    // 8. Transform og/twitter subcomponents into repeatable metaSocial entries.
    //    Runs only while OLD_OG/OLD_TW still exist; otherwise a previous run already
    //    dropped the data and there's nothing to recover.
    await transformOgTwitterToMetaSocial(knex, morphTable)

    // 9. Drop og/twitter cmps links and any leftover morph rows. Must run AFTER
    //    transform so the transform can read those links.
    const clearedLinks = await knex(NEW_CMPS)
      .whereIn("component_type", [OLD_OG_UID, OLD_TW_UID])
      .del()

    if (clearedLinks > 0) {
      console.log(
        `[seo-reshape] cleared ${clearedLinks} remaining og/twitter cmps links`
      )
    }

    if (morphTable) {
      const orphans = await knex(morphTable)
        .whereIn("related_type", [OLD_OG_UID, OLD_TW_UID])
        .del()

      if (orphans > 0) {
        console.log(
          `[seo-reshape] deleted ${orphans} leftover og/twitter morph rows`
        )
      }
    }

    // 10. Drop old og/twitter tables.
    for (const tbl of [OLD_OG, OLD_TW]) {
      if (await knex.schema.hasTable(tbl)) {
        await knex.schema.dropTable(tbl)
        console.log(`[seo-reshape] dropped ${tbl}`)
      }
    }

    // 11. Sanity.
    const [{ c: seoCount }] = await knex(NEW_SEO).count("id as c")
    const [{ c: metaSocialCount }] =
      await knex(NEW_META_SOCIAL).count("id as c")
    console.log(
      `[seo-reshape] ${seoCount} seo rows preserved; ${metaSocialCount} metaSocial rows created from og/twitter`
    )

    console.log("[seo-reshape] complete")
  },

  async down() {
    throw new Error(
      "Irreversible: og/twitter subcomponent data was dropped during reshape"
    )
  },
}
