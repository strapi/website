import type { TransformContext } from "../transforms/base.ts"
import { extractRelationIds } from "../transforms/convert.ts"

export interface ComponentMapping {
  /** v4 component UID */
  source: string
  /** v5 component UID, or null to drop */
  target: string | null
  /** Field-level transforms: v4 field → v5 field (string) or transform config */
  fieldMap?: Record<string, string | FieldTransform>
  /** What to do with fields not in fieldMap. Default: "drop" */
  unmappedFields?: "drop" | "warn" | "passthrough"
  /**
   * Full-component transform. When provided, fieldMap is ignored.
   * Return a single object or an array to expand one source entry
   * into multiple target entries in the dynamic zone.
   * Each returned object must NOT include __component — it's set automatically.
   *
   * The optional `ctx` parameter provides access to the IdMap for resolving
   * v4 relation IDs to v5 document IDs within dynamic zone components.
   */
  transform?: (
    entry: Record<string, unknown>,
    ctx?: TransformContext
  ) => Record<string, unknown> | Record<string, unknown>[]
}

export interface FieldTransform {
  rename?: string
  transform?: (value: unknown) => unknown
}

// ─── Shared extraction helpers ───

interface V4Intro {
  label?: string
  title?: string
  text?: string
  button?: V4Button[]
  center?: boolean
  theme?: string
}

interface V4Button {
  label?: string
  url?: string
  style?: string
  link?: { href?: string; text?: string; target?: string }
}

/** Check if a v4 button-like object has any meaningful data.
 *  v4 uses two button formats: { label, url } and { theme, link: { href, text } } */
function isV4Button(value: unknown): value is V4Button {
  if (!value || typeof value !== "object") return false
  const obj = value as Record<string, unknown>

  return !!(obj["label"] || obj["url"] || obj["link"])
}

interface V4Person {
  name?: string
  description?: string
  image?: V4MediaComponent
  companyLogo?: V4MediaComponent
}

interface V4MediaComponent {
  url?: string
  alternativeText?: string
  width?: number
  height?: number
  [key: string]: unknown
}

function asIntro(value: unknown): V4Intro {
  if (!value || typeof value !== "object") return {}

  return value as V4Intro
}

function asPerson(value: unknown): V4Person {
  if (!value || typeof value !== "object") return {}

  return value as V4Person
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {}

  return value as Record<string, unknown>
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []

  return value as Record<string, unknown>[]
}

/** Extract array from v4 relation format { data: [{ id, attributes }, ...] } */
function extractV4RelationArray(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== "object") return []

  const v = value as Record<string, unknown>
  if (Array.isArray(v["data"])) {
    return (v["data"] as Record<string, unknown>[]).map((item) => {
      const attrs = item["attributes"] as Record<string, unknown> | undefined

      return attrs ? { ...attrs, _v4Id: item["id"] } : item
    })
  }

  if (Array.isArray(value)) return value as Record<string, unknown>[]

  return []
}

/** Extract the actual media attributes from various v4 media formats */
function extractV4Media(media: unknown): V4MediaComponent | undefined {
  if (!media || typeof media !== "object") return undefined
  const m = media as Record<string, unknown>

  // Direct media object with url (already flat)
  if (typeof m["url"] === "string") return m as V4MediaComponent

  // v4 nested format: { data: { id, attributes: { url, ... } } }
  if (m["data"] && typeof m["data"] === "object") {
    const data = m["data"] as Record<string, unknown>
    if (data["attributes"] && typeof data["attributes"] === "object") {
      return data["attributes"] as V4MediaComponent
    }
    // Flat data with url
    if (typeof data["url"] === "string") return data as V4MediaComponent
  }

  // Component wrapper: { image: { data: { ... } } } or { media: { data: { ... } } }
  for (const key of ["image", "media", "logo", "icon"]) {
    const nested = m[key]
    if (nested && typeof nested === "object") {
      const result = extractV4Media(nested)
      if (result) return result
    }
  }

  return undefined
}

/**
 * Wrap a v4 media object into v5 utilities.basic-image shape.
 * Media field is set to null (requires separate upload). CDN URL stored in fallbackSrc.
 */
function wrapBasicImage(media: unknown): Record<string, unknown> | undefined {
  const actual = extractV4Media(media)
  if (!actual?.url) return undefined

  const absoluteUrl = (actual.url as string).startsWith("http")
    ? actual.url
    : `https://delicate-dawn-ac25646e6d.media.strapiapp.com${actual.url}`

  return {
    alt: actual.alternativeText ?? "",
    width: actual.width ?? null,
    height: actual.height ?? null,
    fallbackSrc: absoluteUrl,
  }
}

/** Strip keys with `undefined` values so they don't serialize as `null`. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

/** Default link decorations for v5 utilities.link */
const DEFAULT_LINK_DECORATIONS = {
  variant: "secondary",
  size: "default",
  hasIcons: false,
}

/** Convert v4 button to v5 utilities.link shape */
function buttonToLink(btn: V4Button): Record<string, unknown> {
  // v4 intro buttons use { theme, link: { href, text } } format
  const link = (btn as Record<string, unknown>)["link"] as
    | Record<string, unknown>
    | undefined

  return {
    type: "external",
    label: btn.label ?? (link?.["text"] as string) ?? "",
    newTab: false,
    href: btn.url ?? (link?.["href"] as string) ?? "",
    decorations: { ...DEFAULT_LINK_DECORATIONS },
  }
}

/** Convert v4 links.link component to v5 utilities.link shape */
function linkToV5Link(link: unknown): Record<string, unknown> | undefined {
  if (!link || typeof link !== "object") return undefined
  const l = link as Record<string, unknown>

  return {
    type: "external",
    label: (l["label"] as string) ?? (l["text"] as string) ?? "",
    newTab: false,
    href: (l["url"] as string) ?? (l["href"] as string) ?? "",
    decorations: { ...DEFAULT_LINK_DECORATIONS },
  }
}

/** Build v5 utilities.section-header from common v4 patterns */
function buildSectionHeader(opts: {
  title?: string
  description?: string
  label?: string
  buttons?: V4Button[]
}): Record<string, unknown> {
  const section: Record<string, unknown> = {
    title: opts.title ?? "",
    description: opts.description ?? "",
    variant: "default",
  }

  if (opts.label) section.label = opts.label
  if (opts.buttons?.length) {
    section.ctaLinks = opts.buttons
      .map(buttonToLink)
      .filter((l) => l.label !== "" || l.href !== "")
  }

  return section
}

/** Extract v4 intro component and wrap as v5 section-header */
function introToSectionHeader(
  entry: Record<string, unknown>
): Record<string, unknown> {
  const intro = asIntro(entry["intro"])

  return {
    section: buildSectionHeader({
      label: intro.label,
      title: intro.title,
      description: intro.text,
      buttons: intro.button,
    }),
  }
}

/** Append a link URL to description text */
function appendLinkText(
  description: string | undefined,
  link: unknown
): string {
  const desc = description ?? ""
  if (!link || typeof link !== "object") return desc
  const l = link as Record<string, unknown>
  const url = (l["url"] as string) ?? (l["href"] as string)

  if (!url) return desc

  return desc ? `${desc}\n\nLink: ${url}` : `Link: ${url}`
}

// ─── Component mapping ───

/**
 * Component mapping from v4 → v5.
 *
 * Source names come from the v4 universal schema's `slices` dynamic zone.
 * Target names must match v5 page schema's `content` dynamic zone.
 */
export const COMPONENT_MAP: ComponentMapping[] = [
  // =============================================
  // HEROES → section-header (best available match)
  // =============================================

  // v4 hero-dark: hero.intro (label-title-text-links), youtubeUrl
  // v5: section-header with section (title, description, label, ctaLinks)
  {
    source: "slices.hero-dark",
    target: "sections.section-header",
    transform: (entry) => {
      const hero = asRecord(entry["hero"])
      const intro = asIntro(hero["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },

  // v4 side-hero-with-image: upperTitle, title, description, image, primaryButton, secondaryButton, features[]
  // v5: sections.hero + optional sections.feature-card-grid (multi-emit)
  {
    source: "slices.side-hero-with-image",
    target: "sections.hero",
    transform: (entry) => {
      const buttons: V4Button[] = []
      const primary = entry["primaryButton"]
      if (isV4Button(primary)) buttons.push(primary as V4Button)
      const secondary = entry["secondaryButton"]
      if (isV4Button(secondary)) buttons.push(secondary as V4Button)

      const hero: Record<string, unknown> = {
        label: entry["upperTitle"] as string,
        title: entry["title"] as string,
        description: entry["description"] as string,
        image: wrapBasicImage(entry["image"]),
      }

      const ctas = buttons
        .map(buttonToLink)
        .filter((l) => l.label !== "" || l.href !== "")
      if (ctas.length) hero.ctas = ctas

      const features = asArray(entry["features"])
      if (features.length === 0) return hero

      // Multi-emit: hero + feature-card-grid from features[]
      return [
        hero,
        {
          __component: "sections.feature-card-grid",
          items: features.map((f) =>
            compact({
              title: (f["title"] as string) ?? "",
              description: (f["text"] as string) ?? "",
              icon: wrapBasicImage(f["icon"]),
              image: wrapBasicImage(f["image"]),
            })
          ),
        },
      ]
    },
  },

  // =============================================
  // SECTIONS
  // =============================================

  // --- Text Slice → Section Header ---
  // v4: content (label-title-text-links component with title, text, button[])
  // v5: section-header with section (title, description, ctaLinks)
  {
    source: "slices.text-slice",
    target: "sections.section-header",
    transform: (entry) => {
      // content is a nested component (like intro) with title, text, button[]
      const content = asRecord(entry["content"])
      const intro = asIntro(content)

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title ?? (entry["title"] as string),
          description: intro.text ?? (entry["text"] as string),
          buttons: intro.button,
        }),
      }
    },
  },

  // --- Text Next To Image → Feature Card ---
  // v4: content (title, text, button[]), image, imagePosition
  // v5: feature-card with title, description, image, imagePosition, ctaLinks
  {
    source: "slices.text-next-to-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asRecord(entry["content"])
      const intro = asIntro(content)
      const buttons = intro.button ?? []

      const result: Record<string, unknown> = {
        variant: "bordered",
        size: "lg",
        title: intro.title ?? (content["title"] as string) ?? "",
        description: intro.text ?? (content["text"] as string) ?? "",
        image: wrapBasicImage(entry["image"]),
        imagePosition: (entry["imagePosition"] as string) ?? "right",
      }

      const ctaLinks = buttons
        .map(buttonToLink)
        .filter((l) => l.label !== "" || l.href !== "")

      if (ctaLinks.length > 0) {
        result.ctaLinks = ctaLinks
      }

      return result
    },
  },

  // --- Text With Cards → Feature Card Grid ---
  // v4: intro (label-title-text), cards[] ({ theme, link: { href }, card: { title, text } })
  // v5: section-header (from intro) + feature-card-grid with items
  {
    source: "slices.text-with-cards",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const cards = asArray(entry["cards"])

      const grid: Record<string, unknown> = {
        items: cards.map((rawCard) => {
          const card = asRecord(rawCard["card"])
          const link = asRecord(rawCard["link"])
          const href = (link["href"] as string) ?? ""

          const result: Record<string, unknown> = {
            variant: "bordered",
            title: (card["title"] as string) ?? "",
            description: (card["text"] as string) ?? "",
          }

          if (href) {
            result.ctaLinks = [
              {
                type: "external",
                label: (card["title"] as string) ?? "Learn more",
                newTab: link["target"] === "_blank",
                href,
                decorations: { ...DEFAULT_LINK_DECORATIONS },
              },
            ]
          }

          return result
        }),
      }

      if (intro.title || intro.text) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({
              label: intro.label,
              title: intro.title,
              description: intro.text,
              buttons: intro.button,
            }),
          },
          grid,
        ]
      }

      return grid
    },
  },

  // --- Features Slice → Feature Card Grid ---
  // v4: cards[] (title, text), layout, iconLayout
  // v5: section-header (from title) + feature-card-grid with items
  {
    source: "slices.features-slice",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])
      const title = entry["title"] as string

      const grid: Record<string, unknown> = {
        items: cards.map((card) =>
          compact({
            variant: "bordered",
            title: (card["title"] as string) ?? "",
            description:
              (card["text"] as string) ?? (card["description"] as string) ?? "",
            icon: wrapBasicImage(card["icon"] ?? card["image"]),
          })
        ),
      }

      if (title) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({ title }),
          },
          grid,
        ]
      }

      return grid
    },
  },

  // --- FAQ ---
  // v4: intro (label-title-text-links), categories[] → questions[]
  // v5: faq-section with items only (title is hardcoded on frontend)
  {
    source: "slices.faq",
    target: "sections.faq-section",
    transform: (entry) => {
      const categories = asArray(entry["categories"])

      // Flatten all questions from all categories
      const items: Record<string, unknown>[] = []
      for (const cat of categories) {
        const questions = asArray(cat["questions"])
        for (const q of questions) {
          items.push({
            question: (q["question"] as string) ?? "",
            answer: (q["answer"] as string) ?? "",
          })
        }
      }

      return { items }
    },
  },

  // --- How It Works ---
  // v4: intro (label-title-text-links), step[] (title, description, image)
  // v5: heading, description, items[] (icon, title, description)
  {
    source: "slices.stepper",
    target: "sections.how-it-works",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const steps = asArray(entry["step"])

      return {
        heading: intro.title ?? "",
        description: intro.text ?? "",
        items: steps.map((step) => ({
          title: (step["title"] as string) ?? "",
          description: (step["description"] as string) ?? "",
          icon: wrapBasicImage(step["image"]),
        })),
      }
    },
  },

  // --- Two Columns Benefits ---
  // v4: upperTitle, title, description, benefits[] (title, description, icon)
  // v5: section (section-header), items[] (how-it-works-item)
  {
    source: "slices.two-columns-benefits",
    target: "sections.two-columns-benefits",
    transform: (entry) => {
      const benefits = asArray(entry["benefits"])

      return {
        section: buildSectionHeader({
          label: entry["upperTitle"] as string,
          title: entry["title"] as string,
          description: entry["description"] as string,
        }),
        items: benefits.map((b) =>
          compact({
            title: (b["title"] as string) ?? "",
            description: appendLinkText(b["text"] as string, b["link"]),
            icon: wrapBasicImage(b["icon"] ?? b["image"]),
          })
        ),
      }
    },
  },

  // --- Features Grid → Feature Card Grid ---
  // v4: upperTitle, title, description, cards[] (title, text, icon, image, link, cardConfig)
  // v5: feature-card-grid with per-card layout (full/half/third) from v4 cardConfig
  {
    source: "slices.features-grid",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])
      const title = entry["title"] as string
      const description = entry["description"] as string

      let fullWidthIndex = 0

      const items = cards.map((card) => {
        const cardConfig = (card["cardConfig"] as string) ?? "fullWidth"
        const isFullWidth =
          cardConfig === "fullWidth" || cardConfig === "fullWidthReverseImage"
        const layout =
          cardConfig === "halfWidth"
            ? "half"
            : cardConfig === "thirdWidth"
              ? "third"
              : "full"

        // Alternate image position for full-width cards
        // fullWidthReverseImage explicitly means left, otherwise alternate
        let imagePosition: string | undefined
        if (isFullWidth) {
          imagePosition =
            cardConfig === "fullWidthReverseImage"
              ? "left"
              : fullWidthIndex % 2 === 0
                ? "right"
                : "left"
          fullWidthIndex++
        }

        const result: Record<string, unknown> = compact({
          variant: "bordered",
          layout,
          size: "default",
          title: (card["title"] as string) ?? "",
          description:
            (card["text"] as string) ?? (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["icon"]),
          image: wrapBasicImage(card["image"]),
        })

        if (imagePosition) result.imagePosition = imagePosition

        // Extract CTA from button, link field, or icon.href
        const button = card["button"] as Record<string, unknown> | undefined
        const link = linkToV5Link(card["link"])
        const iconRecord = card["icon"] as Record<string, unknown> | undefined
        const iconHref = iconRecord?.["href"] as string | undefined

        if (button?.["href"]) {
          result.ctaLinks = [
            {
              type: "external",
              label: (button["text"] as string) ?? "Learn more",
              newTab: button["target"] === "_blank",
              href: button["href"] as string,
              decorations: { ...DEFAULT_LINK_DECORATIONS },
            },
          ]
        } else if (link) {
          result.ctaLinks = [link]
        } else if (iconHref) {
          result.ctaLinks = [
            {
              type: "external",
              label: (card["title"] as string) ?? "Learn more",
              newTab: false,
              href: iconHref,
              decorations: { ...DEFAULT_LINK_DECORATIONS },
            },
          ]
        }

        return result
      })

      const grid: Record<string, unknown> = { items }

      if (title || description) {
        grid.section = buildSectionHeader({
          label: entry["upperTitle"] as string,
          title,
          description,
        })
      }

      return grid
    },
  },

  // --- Meet the Team ---
  // v4: intro (label-title-text-links), openPositionsCTA
  // v5: section (section-header), items[] (team-member-item), ctaTitle, ctaLink
  // Note: team members are relation-based in v4, items[] will be empty
  {
    source: "slices.team-slice",
    target: "sections.meet-the-team",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const cta = asRecord(entry["openPositionsCTA"])

      const result: Record<string, unknown> = {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
        items: [], // team members need manual entry (relation-based in v4)
      }

      if (cta["title"] || cta["label"]) {
        result.ctaTitle = (cta["title"] as string) ?? ""
        result.ctaLink = linkToV5Link(cta)
      }

      return result
    },
  },

  // --- Testimonies ---
  // v4: thumbnails[] (image, videoUrl)
  // v5: items[] (image: basic-image, videoUrl)
  {
    source: "slices.testimonies",
    target: "sections.testimonies",
    transform: (entry) => {
      const thumbnails = asArray(entry["thumbnails"])

      const items = thumbnails
        .map((t) => {
          const image = wrapBasicImage(t["image"])
          if (!image) return

          return { image, videoUrl: (t["videoUrl"] as string) ?? "" }
        })
        .filter(Boolean)

      return { items }
    },
  },

  // =============================================
  // CARDS
  // =============================================

  // --- Feature Card → Feature Card Grid ---
  // v4: leftTitle, rightTitle, text, link, features[]
  // v5: feature-card-grid with 1-2 cards
  {
    source: "slices.features-card",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const leftCard: Record<string, unknown> = {
        variant: "bordered",
        title: (entry["leftTitle"] as string) ?? "",
        description: (entry["text"] as string) ?? "",
      }

      const link = linkToV5Link(entry["link"])
      if (link) leftCard.ctaLinks = [link]

      const rightTitle = entry["rightTitle"] as string | undefined
      const features = asArray(entry["features"])
      const items: Record<string, unknown>[] = [leftCard]

      if (rightTitle && features.length > 0) {
        const featureNames = features
          .map(
            (f) =>
              `- **${f["name"] as string}**: ${(f["tooltip"] as string) ?? ""}`
          )
          .join("\n")

        items.push({
          variant: "bordered",
          title: rightTitle,
          description: featureNames,
        })
      }

      return {
        items,
      }
    },
  },

  // --- Case Study Card ---
  // v4: triangleImage, card (relation → case-study with coverImage, whiteHero), buttonText
  // v5: companyName, title, image, ctaLink, backgroundImage
  {
    source: "slices.case-study-card",
    target: "cards.case-study-card",
    transform: (entry) => {
      // card is a v4 relation: { data: { id, attributes: { slug, coverImage, whiteHero, ... } } }
      const cardRaw = asRecord(entry["card"])
      const cardData = asRecord(cardRaw["data"])
      const card = asRecord(cardData["attributes"] ?? cardData)

      const slug = (card["slug"] as string) ?? (cardRaw["slug"] as string) ?? ""

      // Extract company name + title from whiteHero.intro
      const whiteHero = asRecord(card["whiteHero"])
      const heroIntro = asRecord(whiteHero["intro"])

      const companyName =
        (heroIntro["label"] as string) ??
        (card["companyName"] as string) ??
        slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")

      const title =
        (heroIntro["title"] as string) ??
        (card["title"] as string) ??
        (entry["buttonText"] as string) ??
        ""

      return {
        companyName,
        title,
        image: wrapBasicImage(card["coverImage"] ?? card["image"]),
        backgroundImage: wrapBasicImage(entry["triangleImage"]),
        ctaLink: {
          type: "external",
          label: (entry["buttonText"] as string) ?? "Read more",
          newTab: false,
          href: slug ? `/case-studies/${slug}` : "#",
        },
      }
    },
  },

  // --- Content Cards List → multiple Content Cards ---
  // v4: cards[] (each has label, title, content/description)
  // v5: one content-card per array entry (label, title, content)
  {
    source: "slices.content-cards-list",
    target: "cards.content-card",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      if (cards.length === 0) return { title: "", content: "" }

      // Return array → each becomes a separate content-card in the dynamic zone
      return cards.map((card) => ({
        label: (card["label"] as string) ?? "",
        title: (card["title"] as string) ?? "",
        content:
          (card["content"] as string) ?? (card["description"] as string) ?? "",
      }))
    },
  },

  // =============================================
  // MEDIA
  // =============================================

  // --- Image ---
  // v4: image (media component), withShadow, fullWidth, hideOnMobile
  // v5: image (basic-image), link, alignment
  {
    source: "slices.large-image",
    target: "media.image",
    transform: (entry) => ({
      image: wrapBasicImage(entry["image"]),
      alignment: "center",
    }),
  },

  // --- Image Gallery ---
  // v4: image[] (media components)
  // v5: images[] (basic-image[]), variant
  {
    source: "slices.image-gallery",
    target: "media.image-gallery",
    transform: (entry) => ({
      images: asArray(entry["image"]).map(wrapBasicImage).filter(Boolean),
    }),
  },

  // --- Brand Logo Grid ---
  // v4: brands[] (each has image media + link)
  // v5: title, variant, items[] (image: basic-image, hasLink, link, tooltip)
  {
    source: "slices.brands",
    target: "media.brand-logo-grid",
    transform: (entry) => {
      const brands = asArray(entry["brands"])

      const items = brands
        .map((brand) => {
          const image = wrapBasicImage(brand["image"] ?? brand["logo"])
          if (!image) return

          const item: Record<string, unknown> = { image }

          const link = brand["url"] ?? brand["link"]
          if (link && typeof link === "string") {
            item.hasLink = true
            item.link = {
              type: "external",
              label: (brand["name"] as string) ?? "",
              newTab: true,
              href: link,
            }
          }

          return item
        })
        .filter(Boolean)

      return {
        title: (entry["title"] as string) ?? "Brands",
        variant: "bordered",
        items,
      }
    },
  },

  // v4 brands-with-intro: adds intro section + topIntegrations on top of brands
  // v5: section-header (from intro) + brand-logo-grid (multi-emit when intro has content)
  {
    source: "slices.brands-with-intro",
    target: "media.brand-logo-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const brands = asArray(entry["brands"])

      const items = brands
        .map((brand) => {
          const image = wrapBasicImage(brand["image"] ?? brand["logo"])
          if (!image) return

          const item: Record<string, unknown> = { image }

          const link = brand["url"] ?? brand["link"]
          if (link && typeof link === "string") {
            item.hasLink = true
            item.link = {
              type: "external",
              label: (brand["name"] as string) ?? "",
              newTab: true,
              href: link,
            }
          }

          return item
        })
        .filter(Boolean)

      const grid: Record<string, unknown> = {
        title: intro.title ?? (entry["title"] as string) ?? "Brands",
        variant: "bordered",
        items,
      }

      if (intro.title || intro.text) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({
              label: intro.label,
              title: intro.title,
              description: intro.text,
              buttons: intro.button,
            }),
          },
          grid,
        ]
      }

      return grid
    },
  },

  // --- Video ---
  // v4 large-video: intro (title, text, button[]), url, darkMode, size
  // v5: section-header (from intro) + video (multi-emit when intro has content)
  {
    source: "slices.large-video",
    target: "media.video",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const video: Record<string, unknown> = {
        url: (entry["url"] as string) ?? "",
      }

      if (intro.title || intro.text) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({
              label: intro.label,
              title: intro.title,
              description: intro.text,
              buttons: intro.button,
            }),
          },
          video,
        ]
      }

      return video
    },
  },

  // v4 featured-video: video relation → placeholder video
  {
    source: "slices.featured-video",
    target: "media.video",
    transform: () => ({
      url: "", // relation-based — needs manual entry
    }),
  },

  // =============================================
  // TESTIMONIALS
  // =============================================

  // --- Quote ---
  // v4: triangleImage, quote, author (person: name, description, image, companyLogo)
  // v5: quote, authorName, authorRole, authorAvatar, companyLogo, variant, image
  {
    source: "slices.quote",
    target: "testimonials.quote",
    transform: (entry) => {
      const author = asPerson(entry["author"])

      return {
        quote: (entry["quote"] as string) ?? "",
        authorName: author.name ?? "",
        authorRole: author.description ?? "",
        authorAvatar: wrapBasicImage(author.image),
        companyLogo: wrapBasicImage(author.companyLogo),
      }
    },
  },

  // v4 full-width-quote: same as quote + label
  {
    source: "slices.full-width-quote",
    target: "testimonials.quote",
    transform: (entry) => {
      const author = asPerson(entry["author"])

      return {
        quote: (entry["quote"] as string) ?? "",
        authorName: author.name ?? "",
        authorRole: author.description ?? "",
        authorAvatar: wrapBasicImage(author.image),
        companyLogo: wrapBasicImage(author.companyLogo),
      }
    },
  },

  // =============================================
  // FORMS
  // =============================================

  // v4 newsletter-banner: nested newsletter component
  // v5: title, description, emailPlaceholder, submitLabel, consentText
  {
    source: "slices.newsletter-banner",
    target: "forms.newsletter",
    transform: (entry) => {
      const newsletter = asRecord(entry["newsletter"])

      return {
        title: (newsletter["title"] as string) ?? "",
        description: (newsletter["description"] as string) ?? "",
        emailPlaceholder: (newsletter["inputPlaceholder"] as string) ?? "",
        submitLabel: (newsletter["submitLabel"] as string) ?? "",
        consentText: (newsletter["consentNote"] as string) ?? "",
      }
    },
  },

  // =============================================
  // PLANS
  // =============================================

  // v4 plan-cards: complex — title, intro, planTypes[], cards[], toggle config, extraBox
  // v5: switcher, cards[] (relation-based), extraBox
  // Mapping the structural parts; plan relations need separate handling
  {
    source: "slices.plan-cards",
    target: "plans.plan-pricing-cards",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])

      const result: Record<string, unknown> = {
        switcher: {
          title: intro.title ?? (entry["title"] as string) ?? "",
          monthlyTitle: (entry["monthlyTitle"] as string) ?? "Monthly",
          monthlySubtitle: (entry["monthlySubtitle"] as string) ?? "",
          yearlyTitle: (entry["annualTitle"] as string) ?? "Annual",
          yearlySubtitle: (entry["annualSubtitle"] as string) ?? "",
          showYearlyToggle: entry["showAnnualToggle"] ?? true,
          isYearlyDefault: entry["isAnnualDefault"] ?? false,
        },
      }

      // Plan cards reference plans by relation — can't migrate inline
      // Extra box
      if (entry["isExtraBoxVisible"]) {
        const extraFeatures = asArray(entry["extraBoxFeatures"])
        const extraLink = asRecord(entry["extraBoxLink"])

        result.extraBox = {
          title: intro.title ?? "",
          link: linkToV5Link(extraLink),
          features: extraFeatures.map((f) => ({
            title: (f["title"] as string) ?? "",
            tooltip: (f["tooltip"] as string) ?? "",
          })),
        }
      }

      return result
    },
  },

  // v4 plans-grid: plans (relation), compareButtonLabel
  // v5: plans (relation), footnote
  {
    source: "slices.plans-grid",
    target: "plans.plan-comparison-table",
    transform: (entry) => ({
      plans: entry["plans"], // pass through relation data
    }),
  },

  // =============================================
  // SEO (handled separately by seo.ts transform)
  // =============================================

  {
    source: "shared.seo",
    target: "seo-utilities.seo",
    fieldMap: {
      metaTitle: "metaTitle",
      metaDescription: "metaDescription",
      keywords: "keywords",
      canonicalURL: "canonicalUrl",
      structuredData: "structuredData",
    },
    unmappedFields: "drop",
  },

  // =============================================
  // EXPLICITLY DROPPED (no v5 equivalent)
  // =============================================

  // Embeds and third-party integrations
  { source: "slices.chargebee", target: null },
  { source: "slices.chili-piper", target: null },
  { source: "slices.embed-tweets", target: null },
  { source: "slices.twitter-feed", target: null },

  // v4 embed-form: gradientHeader + intro + embedForm → hubspot-form
  // Extracts portalId/formId for entity-level resolveHubspotForms transform
  {
    source: "slices.embed-form",
    target: "forms.hubspot-form",
    transform: (entry) => {
      // portalId/formId can be at top level or nested in embedForm sub-component
      const embedForm = asRecord(entry["embedForm"])
      const portalId =
        (entry["portalId"] as string) ?? (embedForm["portalId"] as string) ?? ""
      const formId =
        (entry["formId"] as string) ?? (embedForm["formId"] as string) ?? ""

      return {
        _hubspotPortalId: portalId,
        _hubspotFormId: formId,
      }
    },
  },

  // v4 embed-form-next-to-cards: formIntro + cards + embedForm → hubspot-form
  {
    source: "slices.embed-form-next-to-cards",
    target: "forms.hubspot-form",
    transform: (entry) => {
      const embedForm = asRecord(entry["embedForm"])
      const portalId =
        (entry["portalId"] as string) ?? (embedForm["portalId"] as string) ?? ""
      const formId =
        (entry["formId"] as string) ?? (embedForm["formId"] as string) ?? ""

      return {
        _hubspotPortalId: portalId,
        _hubspotFormId: formId,
      }
    },
  },

  { source: "slices.embed-guide-flow", target: null },
  { source: "slices.spacer", target: null },

  // v4 dark-cli: title + CLI command text → content-card
  {
    source: "slices.dark-cli",
    target: "cards.content-card",
    transform: (entry) => ({
      label: "",
      title: (entry["title"] as string) ?? "",
      content: (entry["cli"] as string) ?? "",
    }),
  },

  // v4 video-thumbnail: image + videoUrl → video
  {
    source: "slices.video-thumbnail",
    target: "media.video",
    transform: (entry) => ({
      url: (entry["videoUrl"] as string) ?? "",
    }),
  },

  // v4 shared.embed-form: form embed sub-component → hubspot-form
  {
    source: "shared.embed-form",
    target: "forms.hubspot-form",
    transform: () => ({}),
  },

  // Hero variants → section-header
  {
    source: "shared.features-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },
  {
    source: "shared.community-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const whiteHero = asRecord(entry["whiteHero"])
      const intro = asIntro(whiteHero["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },
  {
    source: "shared.white-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },
  {
    source: "shared.use-case-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const hero = asRecord(entry["hero"])
      const intro = asIntro(hero["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description:
            (intro.text ?? "") + ((entry["introText"] as string) ?? ""),
          buttons: intro.button,
        }),
      }
    },
  },
  {
    source: "shared.home-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const hero = asRecord(entry["hero"])
      const intro = asIntro(hero["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },
  // v4 newsletter-hero: newsletter + hero → section-header
  {
    source: "shared.newsletter-hero",
    target: "sections.section-header",
    transform: (entry) => {
      const hero = asRecord(entry["hero"])
      const intro = asIntro(hero["intro"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },

  // ─── Relation-based lists → section-header (content fetched dynamically) ───

  // v4 automated-related-blog-post: keyword filter only
  {
    source: "slices.automated-related-blog-post",
    target: "sections.section-header",
    transform: () => ({
      section: buildSectionHeader({}),
    }),
  },

  // v4 related-blog-posts: intro + blog post relations → blog.related-posts (with section)
  {
    source: "slices.related-blog-posts",
    target: "blog.related-posts",
    transform: (entry, ctx) => {
      const intro = asIntro(entry["intro"])
      const blogPostIds = extractRelationIds(entry["blogPosts"])

      const result: Record<string, unknown> = {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }

      if (ctx && blogPostIds.length > 0) {
        const resolved = blogPostIds
          .map((v4Id) => ctx.idMap.get("api::blog-post.blog-post", v4Id))
          .filter(Boolean) as string[]

        if (resolved.length > 0) {
          result.blogPosts = { set: resolved }
        }
      }

      return result
    },
  },

  // v4 related-posts: blog post + category relations → blog.related-posts (with category)
  {
    source: "slices.related-posts",
    target: "blog.related-posts",
    transform: (entry, ctx) => {
      const result: Record<string, unknown> = {}
      const blogPostIds = extractRelationIds(entry["blogPosts"])

      if (ctx && blogPostIds.length > 0) {
        const resolved = blogPostIds
          .map((v4Id) => ctx.idMap.get("api::blog-post.blog-post", v4Id))
          .filter(Boolean) as string[]

        if (resolved.length > 0) {
          result.blogPosts = { set: resolved }
        }
      }

      const cat = entry["category"] as Record<string, unknown> | undefined

      if (ctx && cat && typeof cat["_v4Id"] === "number") {
        const docId = ctx.idMap.get(
          "api::post-category.post-category",
          cat["_v4Id"] as number
        )

        if (docId) {
          result.category = { set: [docId] }
        }
      }

      return result
    },
  },

  // v4 related-case-studies: title + case study relations
  {
    source: "slices.related-case-studies",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
      }),
    }),
  },

  // v4 related-tutorials: intro + topic filter
  {
    source: "slices.related-tutorials",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 related-showcases: intro + category filter
  {
    source: "slices.related-showcases",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 related-resources: intro + resource relations
  {
    source: "slices.related-resources",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 resource-cards-list: intro + resource cards
  {
    source: "slices.resource-cards-list",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 resource-links: intro + link cards
  {
    source: "slices.resource-links",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 changelogs-list: intro only
  {
    source: "slices.changelogs-list",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 changelogs-timeline: intro + changelog relations
  {
    source: "slices.changelogs-timeline",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 content-videos-list: intro + video category relation
  {
    source: "slices.content-videos-list",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 news-list: intro only
  {
    source: "slices.news-list",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 media-resources-list: intro + media resources
  {
    source: "slices.media-resources-list",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 stories-grid: buttonText + case study relations
  {
    source: "slices.stories-grid",
    target: "sections.section-header",
    transform: () => ({
      section: buildSectionHeader({}),
    }),
  },

  // v4 contributors-slice: intro only
  {
    source: "slices.contributors-slice",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 editor-s-picks: title + blog post relations
  {
    source: "slices.editor-s-picks",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
      }),
    }),
  },

  // ─── Interactive/animated components ───

  // v4 toggle-animations: GraphQL/REST API animation toggles → image placeholder
  {
    source: "slices.toggle-animations",
    target: "media.image",
    transform: () => ({
      alignment: "center",
    }),
  },

  // v4 single-animation: desktop + mobile animations → image placeholder
  {
    source: "slices.single-animation",
    target: "media.image",
    transform: () => ({
      alignment: "center",
    }),
  },

  // v4 stacking-cards: title + cards[] → section-header + feature-card-grid
  {
    source: "slices.stacking-cards",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])
      const title = entry["title"] as string

      const grid: Record<string, unknown> = {
        items: cards.map((card) =>
          compact({
            variant: "bordered",
            title: (card["title"] as string) ?? "",
            description: (card["text"] as string) ?? "",
            icon: wrapBasicImage(card["icon"]),
          })
        ),
      }

      if (title) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({ title }),
          },
          grid,
        ]
      }

      return grid
    },
  },

  // v4 image-slider: multiple images → image gallery
  {
    source: "slices.image-slider",
    target: "media.image-gallery",
    transform: (entry) => ({
      images: extractV4RelationArray(entry["images"])
        .map(wrapBasicImage)
        .filter(Boolean),
    }),
  },

  // v4 reviews-slider: intro + review relations → section-header
  {
    source: "slices.reviews-slider",
    target: "sections.section-header",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])

      return {
        section: buildSectionHeader({
          label: (entry["upperTitle"] as string) ?? intro.label,
          title: (entry["title"] as string) ?? intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
      }
    },
  },

  // v4 dark-reviews-slider: intro + review relations → section-header
  {
    source: "slices.dark-reviews-slider",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 event-slider: intro + events → section-header
  {
    source: "slices.event-slider",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 capabilities-dynamic-cards: upperTitle, title, text, cards[] → feature-card-grid
  {
    source: "slices.capabilities-dynamic-cards",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({
          label: entry["upperTitle"] as string,
          title: entry["title"] as string,
          description: entry["text"] as string,
        }),
        items: cards.map((card) => {
          const result: Record<string, unknown> = compact({
            variant: "bordered",
            layout: "third",
            size: "sm",
            title: (card["title"] as string) ?? "",
            description: (card["text"] as string) ?? "",
            icon: wrapBasicImage(card["icon"]),
            image: wrapBasicImage(card["image"]),
          })

          const link = linkToV5Link(card["link"])
          const iconRecord = card["icon"] as Record<string, unknown> | undefined
          const iconHref = iconRecord?.["href"] as string | undefined

          if (link) {
            result.ctaLinks = [link]
          } else if (iconHref) {
            result.ctaLinks = [
              {
                type: "external",
                label: (card["title"] as string) ?? "Learn more",
                newTab: false,
                href: iconHref,
                decorations: { ...DEFAULT_LINK_DECORATIONS },
              },
            ]
          }

          return result
        }),
      }
    },
  },

  // v4 capability-cards: capabilityCards[] → two-column-grid
  {
    source: "slices.capability-cards",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const cards = asArray(entry["capabilityCards"])

      return {
        section: buildSectionHeader({}),
        items: cards.map((card) => ({
          title: (card["title"] as string) ?? "",
          description: (card["text"] as string) ?? "",
          icon: wrapBasicImage(card["icon"] ?? card["image"]),
        })),
      }
    },
  },

  // =============================================
  // TEXT / CONTENT SECTIONS
  // =============================================

  // v4 universal-rich-text: gradientHeader, richText
  // v5: content-card (label, title, content)
  {
    source: "slices.universal-rich-text",
    target: "cards.content-card",
    transform: (entry) => {
      const header = asRecord(entry["gradientHeader"])

      return {
        label: "",
        title: (header["title"] as string) ?? "",
        content: (entry["richText"] as string) ?? "",
      }
    },
  },

  // v4 intro: content (label-title-text-links), decoration, center
  // v5: hero (intro sections typically appear at the top of pages)
  {
    source: "slices.intro",
    target: "sections.hero",
    transform: (entry) => {
      const content = asIntro(entry["content"])
      const buttons = asArray(content.button) as V4Button[]
      const ctas = buttons
        .map(buttonToLink)
        .filter((l) => l.label !== "" || l.href !== "")

      const result: Record<string, unknown> = {
        label: content.label ?? "",
        title: content.title ?? "",
        description: content.text ?? "",
      }

      if (ctas.length > 0) result.ctas = ctas

      return result
    },
  },

  // v4 new-intro: darkMode, title, logo, button, embed
  // v5: section-header
  {
    source: "slices.new-intro",
    target: "sections.section-header",
    transform: (entry) => {
      const btn = entry["button"]
      const buttons: V4Button[] = isV4Button(btn) ? [btn as V4Button] : []

      return {
        section: buildSectionHeader({
          title: entry["title"] as string,
          buttons,
        }),
      }
    },
  },

  // v4 text-next-to-big-image: image, theme, content, title, text, layout
  // v5: feature-card
  {
    source: "slices.text-next-to-big-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        variant: "bordered",
        title: (entry["title"] as string) ?? content.title ?? "",
        description: (entry["text"] as string) ?? content.text ?? "",
        image: wrapBasicImage(entry["image"]),
      }
    },
  },

  // v4 text-next-to-parallelogram-image → feature-card
  {
    source: "slices.text-next-to-parallelogram-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        variant: "bordered",
        title: (entry["title"] as string) ?? content.title ?? "",
        description: (entry["text"] as string) ?? content.text ?? "",
        image: wrapBasicImage(entry["image"]),
      }
    },
  },

  // v4 simple-text-next-to-image: label, headline, text, imagePosition, button, image
  // v5: feature-card
  {
    source: "slices.simple-text-next-to-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const btn = entry["button"]
      const buttons: V4Button[] = isV4Button(btn) ? [btn as V4Button] : []
      const ctaLinks = buttons.map(buttonToLink)

      return {
        variant: "bordered",
        title: (entry["headline"] as string) ?? "",
        description: (entry["text"] as string) ?? "",
        image: wrapBasicImage(entry["image"]),
        ctaLinks: ctaLinks.length > 0 ? ctaLinks : undefined,
      }
    },
  },

  // v4 text-surrounded-by-two-images → feature-card (text only, images as fallback)
  {
    source: "slices.text-surrounded-by-two-images",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        variant: "bordered",
        title: content.title ?? "",
        description: content.text ?? "",
      }
    },
  },

  // v4 text-with-image-and-gradient → feature-card
  {
    source: "slices.text-with-image-and-gradient",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        variant: "bordered",
        title: content.title ?? "",
        description: content.text ?? "",
        image: wrapBasicImage(entry["image"]),
      }
    },
  },

  // v4 text-with-key-numbers → content-card (flatten stats into content)
  {
    source: "slices.text-with-key-numbers",
    target: "cards.content-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        label: content.label ?? "",
        title: content.title ?? "",
        content: content.text ?? "",
      }
    },
  },

  // v4 section-with-image → feature-card
  // v4 fields: title, text, textPosition, button (links.button), image (media.image)
  {
    source: "slices.section-with-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const textPos = (entry["textPosition"] as string) ?? "left"
      const btn = entry["button"] as V4Button | undefined

      const result: Record<string, unknown> = {
        variant: "bordered",
        title: (entry["title"] as string) ?? "",
        description: (entry["text"] as string) ?? "",
        image: wrapBasicImage(entry["image"]),
        imagePosition: textPos === "left" ? "right" : "left",
      }

      if (btn) {
        const link = buttonToLink(btn)
        if (link.label || link.href) {
          result.ctaLinks = [link]
        }
      }

      return result
    },
  },

  // =============================================
  // FEATURE SECTIONS
  // =============================================

  // v4 large-features-slice: intro, mainFeatures (single features-slice), extraFeatures (single features-slice)
  // Each features-slice has title + cards[] (shared.card: icon, title, text)
  // v5: two-column-grid
  {
    source: "slices.large-features-slice",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const main = asRecord(entry["mainFeatures"])
      const extra = asRecord(entry["extraFeatures"])
      const allCards = [...asArray(main["cards"]), ...asArray(extra["cards"])]

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
        items: allCards.map((card) =>
          compact({
            title: (card["title"] as string) ?? "",
            description: (card["text"] as string) ?? "",
            icon: wrapBasicImage(card["icon"]),
          })
        ),
      }
    },
  },

  // v4 top-features: intro, features[]
  // v5: two-column-grid
  {
    source: "slices.top-features",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const features = asArray(entry["features"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
        items: features.map((f) =>
          compact({
            title: (f["title"] as string) ?? "",
            description: (f["text"] as string) ?? "",
            icon: wrapBasicImage(f["icon"]),
          })
        ),
      }
    },
  },

  // v4 icon-cards: cards[] (card-with-link: { link, card: shared.card, theme })
  // v5: two-column-grid
  {
    source: "slices.icon-cards",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({}),
        items: cards.map((wrapper) => {
          const inner = asRecord(wrapper["card"])

          return compact({
            title: (inner["title"] as string) ?? "",
            description: (inner["text"] as string) ?? "",
            icon: wrapBasicImage(inner["icon"]),
          })
        }),
      }
    },
  },

  // v4 summarize-benefits → two-column-grid
  {
    source: "slices.summarize-benefits",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const benefits = asArray(entry["benefits"])

      return {
        section: buildSectionHeader({
          label: intro?.label,
          title: (entry["title"] as string) ?? intro?.title ?? "",
          description: intro?.text,
        }),
        items: benefits.map((b) =>
          compact({
            title: (b["title"] as string) ?? "",
            description: (b["text"] as string) ?? "",
            icon: wrapBasicImage(b["icon"]),
          })
        ),
      }
    },
  },

  // v4 benefits-header: title/description + multiple card groups → two-columns-benefits
  {
    source: "slices.benefits-header",
    target: "sections.two-columns-benefits",
    transform: (entry) => {
      const allCards = [
        ...asArray(entry["certificationCards"]),
        ...asArray(entry["benefitsCards"]),
        ...asArray(entry["impactCards"]),
      ]

      return {
        section: buildSectionHeader({
          label: entry["upperTitle"] as string,
          title: entry["title"] as string,
          description: entry["description"] as string,
        }),
        items: allCards.map((card) =>
          compact({
            title: (card["title"] as string) ?? "",
            description: (card["text"] as string) ?? "",
            icon: wrapBasicImage(card["icon"]),
          })
        ),
      }
    },
  },

  { source: "slices.icon-with-tooltip", target: null },

  // v4 themed-cards: intro + themed card details → section-header + feature-card-grid
  {
    source: "slices.themed-cards",
    target: "sections.feature-card-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const cards = asArray(entry["cards"])

      const grid: Record<string, unknown> = {
        items: cards.map((card) => ({
          variant: "bordered",
          title: (card["title"] as string) ?? "",
          description: (card["text"] as string) ?? "",
        })),
      }

      if (intro.title || intro.text) {
        return [
          {
            __component: "sections.section-header",
            section: buildSectionHeader({
              label: intro.label,
              title: intro.title,
              description: intro.text,
            }),
          },
          grid,
        ]
      }

      return grid
    },
  },

  // =============================================
  // CTA / BANNER SECTIONS
  // =============================================

  // v4 cta-banner: image, text (label-title-text-links)
  // v5: section-header
  {
    source: "slices.cta-banner",
    target: "sections.section-header",
    transform: (entry) => {
      const text = asIntro(entry["text"])

      return {
        section: buildSectionHeader({
          label: text.label,
          title: text.title,
          description: text.text,
          buttons: text.button,
        }),
      }
    },
  },

  // v4 dark-cta-banner: title, description, button, features[]
  // v5: section-header
  {
    source: "slices.dark-cta-banner",
    target: "sections.section-header",
    transform: (entry) => {
      const btn = entry["button"]
      const buttons: V4Button[] = isV4Button(btn) ? [btn as V4Button] : []

      return {
        section: buildSectionHeader({
          title: entry["title"] as string,
          description: entry["description"] as string,
          buttons,
        }),
      }
    },
  },

  // v4 new-cta: title, text (richtext), button
  // v5: section-header
  {
    source: "slices.new-cta",
    target: "sections.section-header",
    transform: (entry) => {
      const btn = entry["button"]
      const buttons: V4Button[] = isV4Button(btn) ? [btn as V4Button] : []

      return {
        section: buildSectionHeader({
          title: entry["title"] as string,
          description: entry["text"] as string,
          buttons,
        }),
      }
    },
  },

  // v4 headline-art: darkMode, layout, title
  // v5: section-header
  {
    source: "slices.headline-art",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
      }),
    }),
  },

  // v4 large-plan-card: plan relation + title/label → content-card
  {
    source: "slices.large-plan-card",
    target: "cards.content-card",
    transform: (entry) => ({
      label: (entry["label"] as string) ?? "",
      title: (entry["title"] as string) ?? "",
      content: "", // plan details are relation-based
    }),
  },

  { source: "slices.plan-type-selector", target: null },

  // ─── Contact/demo/form layouts ───

  // v4 get-demo-info: step cards + demo highlights → section-header
  {
    source: "slices.get-demo-info",
    target: "sections.section-header",
    transform: () => ({
      section: buildSectionHeader({}),
    }),
  },

  // v4 get-demo-layout: form layout → hubspot-form placeholder
  {
    source: "slices.get-demo-layout",
    target: "forms.hubspot-form",
    transform: () => ({}),
  },

  // v4 next-to-form-section: header + demo info → section-header
  {
    source: "slices.next-to-form-section",
    target: "sections.section-header",
    transform: () => ({
      section: buildSectionHeader({}),
    }),
  },

  // v4 contact-header: title/description + benefit cards → section-header
  {
    source: "slices.contact-header",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        label: entry["upperTitle"] as string,
        title: entry["title"] as string,
        description: entry["description"] as string,
      }),
    }),
  },

  // v4 contact-form-section: title + form embed → hubspot-form
  {
    source: "slices.contact-form-section",
    target: "forms.hubspot-form",
    transform: () => ({}),
  },

  // v4 contact-sales-layout: form layout → hubspot-form
  {
    source: "slices.contact-sales-layout",
    target: "forms.hubspot-form",
    transform: () => ({}),
  },

  // ─── Grid/list sections ───

  // v4 getting-started-grid: starting-point cards → two-column-grid
  {
    source: "slices.getting-started-grid",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({}),
        items: cards.map((card) => ({
          title: (card["title"] as string) ?? "",
          description: (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["logo"]),
        })),
      }
    },
  },

  // v4 info-cta-grid: info-cta items → two-column-grid
  {
    source: "slices.info-cta-grid",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const items = asArray(entry["items"])

      return {
        section: buildSectionHeader({}),
        items: items.map((item) => ({
          title: (item["title"] as string) ?? "",
          description: (item["text"] as string) ?? "",
          icon: wrapBasicImage(item["icon"]),
        })),
      }
    },
  },

  // v4 socials-grid: intro + social links + cards → section-header
  {
    source: "slices.socials-grid",
    target: "sections.section-header",
    transform: introToSectionHeader,
  },

  // v4 tech-stack-icon-list: icons with tooltips → brand-logo-grid
  {
    source: "slices.tech-stack-icon-list",
    target: "media.brand-logo-grid",
    transform: (entry) => {
      const icons = asArray(entry["icons"])

      return {
        variant: "bordered",
        items: icons.map((icon) => ({
          image: wrapBasicImage(icon["icon"]),
        })),
      }
    },
  },

  // ─── Misc sections ───

  // v4 interview: Q&A format → faq-section
  {
    source: "slices.interview",
    target: "sections.faq-section",
    transform: (entry) => {
      const questions = asArray(entry["questionAnswer"])

      return {
        sectionLabel: "",
        heading: "",
        description: "",
        items: questions.map((qa) => ({
          question: (qa["question"] as string) ?? "",
          answer: (qa["answer"] as string) ?? "",
        })),
      }
    },
  },

  // v4 community-section: title + description + cards → section-header
  {
    source: "slices.community-section",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
        description: entry["description"] as string,
      }),
    }),
  },

  // v4 company-stat-list: stats[] → two-column-grid
  {
    source: "slices.company-stat-list",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const stats = asArray(entry["stats"])

      return {
        section: buildSectionHeader({}),
        items: stats.map((stat) => ({
          title: (stat["boldTitle"] as string) ?? "",
          description: (stat["text"] as string) ?? "",
        })),
      }
    },
  },

  // v4 company-stat: boldTitle + title + text → content-card
  {
    source: "slices.company-stat",
    target: "cards.content-card",
    transform: (entry) => ({
      label: "",
      title: (entry["boldTitle"] as string) ?? "",
      content: (entry["title"] as string) ?? "",
    }),
  },

  // v4 event-section: title + description + events → section-header
  {
    source: "slices.event-section",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
        description: entry["description"] as string,
      }),
    }),
  },

  // v4 awards-launch-section: title + description + image → section-header
  {
    source: "slices.awards-launch-section",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        title: entry["title"] as string,
        description: entry["description"] as string,
      }),
    }),
  },

  // v4 issues-header: title/description + feature cards → section-header
  {
    source: "slices.issues-header",
    target: "sections.section-header",
    transform: (entry) => ({
      section: buildSectionHeader({
        label: entry["upperTitle"] as string,
        title: entry["title"] as string,
        description: entry["description"] as string,
      }),
    }),
  },

  // v4 launch-event: title + date + link → content-card
  {
    source: "slices.launch-event",
    target: "cards.content-card",
    transform: (entry) => ({
      label: "",
      title: (entry["title"] as string) ?? "",
      content: (entry["youtubeUrl"] as string) ?? "",
    }),
  },

  // v4 perk-group: groupName + perks[] → two-column-grid
  {
    source: "slices.perk-group",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const perks = asArray(entry["perks"])

      return {
        section: buildSectionHeader({
          title: entry["groupName"] as string,
        }),
        items: perks.map((perk) =>
          compact({
            title: (perk["title"] as string) ?? "",
            description: (perk["text"] as string) ?? "",
            icon: wrapBasicImage(perk["image"]),
          })
        ),
      }
    },
  },

  // v4 perk-lists: intro + perk groups → two-column-grid (flattened)
  {
    source: "slices.perk-lists",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const introComp = asRecord(entry["intro"])
      const content = asIntro(introComp["content"])
      const groups = asArray(entry["groups"])
      const allPerks = groups.flatMap((g) => asArray(g["perks"]))

      return {
        section: buildSectionHeader({
          label: content.label,
          title: content.title,
          description: content.text,
        }),
        items: allPerks.map((perk) =>
          compact({
            title: (perk["title"] as string) ?? "",
            description: (perk["text"] as string) ?? "",
            icon: wrapBasicImage(perk["image"]),
          })
        ),
      }
    },
  },

  // v4 perk: title + text + image → feature-card
  {
    source: "slices.perk",
    target: "cards.feature-card",
    transform: (entry) =>
      compact({
        variant: "bordered",
        title: (entry["title"] as string) ?? "",
        description: (entry["text"] as string) ?? "",
        image: wrapBasicImage(entry["image"]),
      }),
  },
]
