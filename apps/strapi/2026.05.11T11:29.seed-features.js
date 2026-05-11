/* eslint-disable no-console */
/**
 * Seed features from database/migrations/features.json into the `features` collection type.
 * Each card -> Feature row; `label` resolves to a feature_tag relation.
 *
 * Step 1: extract unique labels, insert draft + published feature_tag rows.
 * Step 2: insert draft + published feature rows (with `url`), wire each to its
 *         tag via features_feature_tag_lnk (draft<->draft, published<->published).
 *
 * Icons are attached in a separate follow-up migration so the icon source can
 * vary per environment without touching this seed.
 */

"use strict"

const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")

const FEATURES_JSON = path.join(__dirname, "features.json")
const FEATURE_TAGS_TABLE = "feature_tags"
const FEATURES_TABLE = "features"
const FEATURES_TAG_LNK_TABLE = "features_feature_tag_lnk"

function loadCards() {
  if (!fs.existsSync(FEATURES_JSON)) {
    console.log(`[seed-features] ${FEATURES_JSON} not found, skipping`)

    return null
  }

  const { cards } = JSON.parse(fs.readFileSync(FEATURES_JSON, "utf8"))

  if (!Array.isArray(cards)) {
    console.log(`[seed-features] no cards array in features.json, skipping`)

    return null
  }

  return cards
}

async function loadTagState(knex, titles) {
  const rows = await knex(FEATURE_TAGS_TABLE)
    .whereIn("title", titles)
    .select("title", "document_id", "published_at")

  const map = new Map()
  for (const row of rows) {
    const s = map.get(row.title) ?? {
      documentId: row.document_id,
      hasDraft: false,
      hasPublished: false,
    }
    if (row.published_at === null) s.hasDraft = true
    else s.hasPublished = true
    map.set(row.title, s)
  }

  return map
}

async function seedTags(knex, labels, now) {
  const stateByTitle = await loadTagState(knex, labels)
  let inserted = 0

  for (const title of labels) {
    const state = stateByTitle.get(title) ?? {
      documentId: crypto.randomUUID(),
      hasDraft: false,
      hasPublished: false,
    }

    if (state.hasDraft && state.hasPublished) {
      console.log(`[seed-features] tag complete, skipping: ${title}`)
      continue
    }

    const base = {
      document_id: state.documentId,
      title,
      created_at: now,
      updated_at: now,
      locale: "en",
    }

    if (!state.hasDraft) {
      await knex(FEATURE_TAGS_TABLE).insert({ ...base, published_at: null })
      inserted += 1
      console.log(`[seed-features] inserted draft tag: ${title}`)
    }
    if (!state.hasPublished) {
      await knex(FEATURE_TAGS_TABLE).insert({ ...base, published_at: now })
      inserted += 1
      console.log(`[seed-features] inserted published tag: ${title}`)
    }
  }

  console.log(`[seed-features] feature-tag rows inserted: ${inserted}`)
}

async function loadTagIdsByLabel(knex, labels) {
  const rows = await knex(FEATURE_TAGS_TABLE)
    .whereIn("title", labels)
    .select("id", "title", "published_at")

  const map = new Map()
  for (const row of rows) {
    const entry = map.get(row.title) ?? { draftId: null, publishedId: null }
    if (row.published_at === null) entry.draftId = row.id
    else entry.publishedId = row.id
    map.set(row.title, entry)
  }

  return map
}

async function loadFeatureState(knex, titles) {
  const rows = await knex(FEATURES_TABLE)
    .whereIn("title", titles)
    .select("id", "title", "document_id", "published_at")

  const map = new Map()
  for (const row of rows) {
    const s = map.get(row.title) ?? {
      documentId: row.document_id,
      draftId: null,
      publishedId: null,
    }
    if (row.published_at === null) s.draftId = row.id
    else s.publishedId = row.id
    map.set(row.title, s)
  }

  return map
}

async function insertFeatureRow(knex, base, publishedAt) {
  const [r] = await knex(FEATURES_TABLE)
    .insert({ ...base, published_at: publishedAt })
    .returning("id")

  return typeof r === "object" ? r.id : r
}

async function linkFeatureTag(knex, featureId, tagId) {
  if (!tagId) return false
  await knex(FEATURES_TAG_LNK_TABLE).insert({
    feature_id: featureId,
    feature_tag_id: tagId,
    feature_ord: 1,
  })

  return true
}

async function seedFeatureCard(knex, card, ctx) {
  const { title, description, label, url } = card
  const { now, tagIdsByLabel, featureStateByTitle, counters } = ctx

  if (!title) {
    console.log(`[seed-features] card missing title, skipping`)

    return
  }

  const tagIds = tagIdsByLabel.get(label)
  if (!tagIds) {
    console.log(
      `[seed-features] no tag for label "${label}", skipping feature: ${title}`
    )

    return
  }

  const state = featureStateByTitle.get(title) ?? {
    documentId: crypto.randomUUID(),
    draftId: null,
    publishedId: null,
  }

  if (state.draftId && state.publishedId) {
    console.log(`[seed-features] feature complete, skipping: ${title}`)

    return
  }

  const base = {
    document_id: state.documentId,
    title,
    description: description ?? null,
    url: url ?? null,
    created_at: now,
    updated_at: now,
    locale: "en",
  }

  if (!state.draftId) {
    const id = await insertFeatureRow(knex, base, null)
    counters.features += 1
    if (await linkFeatureTag(knex, id, tagIds.draftId)) counters.links += 1
  }

  if (!state.publishedId) {
    const id = await insertFeatureRow(knex, base, now)
    counters.features += 1
    if (await linkFeatureTag(knex, id, tagIds.publishedId)) counters.links += 1
  }

  console.log(`[seed-features] inserted feature: ${title} (${label})`)
}

async function seedFeatures(knex, cards, labels, now) {
  const tagIdsByLabel = await loadTagIdsByLabel(knex, labels)
  const featureStateByTitle = await loadFeatureState(
    knex,
    cards.map((c) => c.title)
  )

  const counters = { features: 0, links: 0 }
  const ctx = { now, tagIdsByLabel, featureStateByTitle, counters }

  for (const card of cards) {
    await seedFeatureCard(knex, card, ctx)
  }

  console.log(
    `[seed-features] features inserted: ${counters.features}, links: ${counters.links}`
  )
}

module.exports = {
  async up(knex) {
    const cards = loadCards()
    if (!cards) return

    console.log(`[seed-features] loaded ${cards.length} cards`)

    const uniqueLabels = [...new Set(cards.map((c) => c.label).filter(Boolean))]
    console.log(
      `[seed-features] ${uniqueLabels.length} unique labels: ${uniqueLabels.join(", ")}`
    )

    const now = new Date()
    await seedTags(knex, uniqueLabels, now)
    await seedFeatures(knex, cards, uniqueLabels, now)
  },

  async down() {
    throw new Error("Irreversible: feature seed migration has no down step")
  },
}
