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
   */
  transform?: (
    entry: Record<string, unknown>
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

/** Convert v4 button to v5 utilities.link shape */
function buttonToLink(btn: V4Button): Record<string, unknown> {
  return {
    type: "external",
    label: btn.label ?? "",
    newTab: false,
    href: btn.url ?? "",
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
  }

  if (opts.label) section.label = opts.label
  if (opts.buttons?.length) {
    section.ctaLinks = opts.buttons.map(buttonToLink)
  }

  return section
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

  // v4 side-hero-with-image: upperTitle, title, description, primaryButton, secondaryButton, features[]
  {
    source: "slices.side-hero-with-image",
    target: "sections.section-header",
    transform: (entry) => {
      const buttons: V4Button[] = []
      const primary = asRecord(entry["primaryButton"])
      if (primary["label"]) buttons.push(primary as V4Button)
      const secondary = asRecord(entry["secondaryButton"])
      if (secondary["label"]) buttons.push(secondary as V4Button)

      return {
        section: buildSectionHeader({
          label: entry["upperTitle"] as string,
          title: entry["title"] as string,
          description: entry["description"] as string,
          buttons,
        }),
      }
    },
  },

  // =============================================
  // SECTIONS
  // =============================================

  // --- FAQ ---
  // v4: intro (label-title-text-links), categories[] → questions[]
  // v5: sectionLabel, heading, description, items[] (flat accordions)
  {
    source: "slices.faq",
    target: "sections.faq-section",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
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

      return {
        sectionLabel: intro.label ?? "",
        heading: intro.title ?? "",
        description: intro.text ?? "",
        items,
      }
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
        items: benefits.map((b) => ({
          title: (b["title"] as string) ?? "",
          description: appendLinkText(b["description"] as string, b["link"]),
          icon: wrapBasicImage(b["icon"] ?? b["image"]),
        })),
      }
    },
  },

  // --- Features Grid → multiple Feature Cards ---
  // v4: upperTitle, title, description, cards[] (title, text, icon, image, link, cardConfig)
  // v5: one feature-card per card entry (title, description, icon, image, ctaLinks)
  {
    source: "slices.features-grid",
    target: "cards.feature-card",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      if (cards.length === 0)
        return { title: "", description: "", variant: "bordered" }

      // Multi-emit: each card becomes a separate feature-card in the dynamic zone
      return cards.map((card) => {
        const result: Record<string, unknown> = {
          variant: "bordered",
          title: (card["title"] as string) ?? "",
          description:
            (card["text"] as string) ?? (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["icon"]),
          image: wrapBasicImage(card["image"]),
        }

        const link = linkToV5Link(card["link"])
        if (link) result.ctaLinks = [link]

        return result
      })
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

      return {
        items: thumbnails.map((t) => ({
          image: wrapBasicImage(t["image"]),
          videoUrl: (t["videoUrl"] as string) ?? "",
        })),
      }
    },
  },

  // =============================================
  // CARDS
  // =============================================

  // --- Feature Card ---
  // v4: leftTitle, rightTitle, text, link, features[]
  // v5: title, description, icon, image, ctaLinks[]
  {
    source: "slices.features-card",
    target: "cards.feature-card",
    transform: (entry) => {
      const result: Record<string, unknown> = {
        variant: "bordered",
        title: (entry["leftTitle"] as string) ?? "",
        description: (entry["text"] as string) ?? "",
      }

      const link = linkToV5Link(entry["link"])
      if (link) result.ctaLinks = [link]

      return result
    },
  },

  // --- Case Study Card ---
  // v4: triangleImage, card (relation), buttonText
  // v5: companyName, title, image, ctaLink, backgroundImage
  {
    source: "slices.case-study-card",
    target: "cards.case-study-card",
    transform: (entry) => {
      const card = asRecord(entry["card"])
      const slug = (card["slug"] as string) ?? ""

      return {
        companyName: (card["companyName"] as string) ?? "",
        title:
          (card["title"] as string) ?? (entry["buttonText"] as string) ?? "",
        image: wrapBasicImage(entry["triangleImage"]),
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

      return {
        items: brands.map((brand) => {
          const item: Record<string, unknown> = {
            image: wrapBasicImage(brand["image"] ?? brand["logo"]),
          }

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
        }),
      }
    },
  },

  // v4 brands-with-intro: adds intro section + topIntegrations on top of brands
  {
    source: "slices.brands-with-intro",
    target: "media.brand-logo-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const brands = asArray(entry["brands"])

      return {
        title: intro.title ?? "",
        items: brands.map((brand) => {
          const item: Record<string, unknown> = {
            image: wrapBasicImage(brand["image"] ?? brand["logo"]),
          }

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
        }),
      }
    },
  },

  // --- Video ---
  // v4 large-video: intro, url, darkMode, size
  // v5: url, thumbnail, link, alignment
  {
    source: "slices.large-video",
    target: "media.video",
    transform: (entry) => ({
      url: (entry["url"] as string) ?? "",
    }),
  },

  // v4 featured-video: relation-based, drop
  { source: "slices.featured-video", target: null },

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
  { source: "slices.embed-form", target: null },
  { source: "slices.embed-form-next-to-cards", target: null },
  { source: "slices.embed-guide-flow", target: null },
  { source: "slices.spacer", target: null },
  { source: "slices.dark-cli", target: null },
  { source: "slices.video-thumbnail", target: null },
  { source: "shared.embed-form", target: null },

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
  { source: "shared.newsletter-hero", target: null },

  // Relation-based list/grid components (fetch data dynamically)
  { source: "slices.automated-related-blog-post", target: null },
  { source: "slices.related-blog-posts", target: null },
  { source: "slices.related-posts", target: null },
  { source: "slices.related-case-studies", target: null },
  { source: "slices.related-tutorials", target: null },
  { source: "slices.related-showcases", target: null },
  { source: "slices.related-resources", target: null },
  { source: "slices.resource-cards-list", target: null },
  { source: "slices.resource-links", target: null },
  { source: "slices.changelogs-list", target: null },
  { source: "slices.changelogs-timeline", target: null },
  { source: "slices.content-videos-list", target: null },
  { source: "slices.news-list", target: null },
  { source: "slices.media-resources-list", target: null },
  { source: "slices.stories-grid", target: null },
  { source: "slices.integration-cards-grid", target: null },
  { source: "slices.integrations", target: null },
  { source: "slices.contributors-slice", target: null },
  { source: "slices.editor-s-picks", target: null },

  // Layout/interactive components without v5 equivalent
  { source: "slices.toggle-animations", target: null },
  { source: "slices.single-animation", target: null },
  { source: "slices.stacking-cards", target: null },
  { source: "slices.image-slider", target: null },
  { source: "slices.reviews-slider", target: null },
  { source: "slices.dark-reviews-slider", target: null },
  { source: "slices.event-slider", target: null },
  { source: "slices.capabilities-dynamic-cards", target: null },
  { source: "slices.capability-cards", target: null },

  // =============================================
  // TEXT / CONTENT SECTIONS
  // =============================================

  // v4 text-slice: layout, alignCenter, withBackground, content (label-title-text-links)
  // v5: content-card (label, title, content)
  {
    source: "slices.text-slice",
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
  // v5: section-header with section
  {
    source: "slices.intro",
    target: "sections.section-header",
    transform: (entry) => {
      const content = asIntro(entry["content"])

      return {
        section: buildSectionHeader({
          label: content.label,
          title: content.title,
          description: content.text,
          buttons: content.button,
        }),
      }
    },
  },

  // v4 new-intro: darkMode, title, logo, button, embed
  // v5: section-header
  {
    source: "slices.new-intro",
    target: "sections.section-header",
    transform: (entry) => {
      const btn = asRecord(entry["button"])
      const buttons: V4Button[] = btn["label"] ? [btn as V4Button] : []

      return {
        section: buildSectionHeader({
          title: entry["title"] as string,
          buttons,
        }),
      }
    },
  },

  // v4 text-next-to-image: title, text, quote, author, image, textPosition
  // v5: feature-card (title, description, image)
  {
    source: "slices.text-next-to-image",
    target: "cards.feature-card",
    transform: (entry) => {
      const content = asIntro(entry["content"])
      const title = (entry["title"] as string) ?? content.title ?? ""
      const text = (entry["text"] as string) ?? content.text ?? ""

      return {
        variant: "bordered",
        title,
        description: text,
        image: wrapBasicImage(entry["image"]),
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
      const btn = asRecord(entry["button"])
      const buttons: V4Button[] = btn["label"] ? [btn as V4Button] : []
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

  // v4 text-with-cards: intro, cardsIntro, cards[]
  // v5: two-column-grid (section + items)
  {
    source: "slices.text-with-cards",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
        items: cards.map((card) => ({
          title: (card["title"] as string) ?? "",
          description: (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["icon"] ?? card["image"]),
        })),
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
  {
    source: "slices.section-with-image",
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

  // =============================================
  // FEATURE SECTIONS
  // =============================================

  // v4 features-slice: title, cards[], layout, iconLayout
  // v5: two-column-grid
  {
    source: "slices.features-slice",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({
          title: entry["title"] as string,
        }),
        items: cards.map((card) => ({
          title: (card["title"] as string) ?? "",
          description: (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["icon"] ?? card["image"]),
        })),
      }
    },
  },

  // v4 large-features-slice: intro, mainFeatures[], extraFeatures[]
  // v5: two-column-grid
  {
    source: "slices.large-features-slice",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const intro = asIntro(entry["intro"])
      const mainFeatures = asArray(entry["mainFeatures"])
      const extraFeatures = asArray(entry["extraFeatures"])
      const allFeatures = [...mainFeatures, ...extraFeatures]

      return {
        section: buildSectionHeader({
          label: intro.label,
          title: intro.title,
          description: intro.text,
          buttons: intro.button,
        }),
        items: allFeatures.map((f) => ({
          title: (f["title"] as string) ?? "",
          description: (f["description"] as string) ?? "",
          icon: wrapBasicImage(f["icon"] ?? f["image"]),
        })),
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
        items: features.map((f) => ({
          title: (f["title"] as string) ?? "",
          description: (f["description"] as string) ?? "",
          icon: wrapBasicImage(f["icon"] ?? f["image"]),
        })),
      }
    },
  },

  // v4 icon-cards: cards[]
  // v5: two-column-grid
  {
    source: "slices.icon-cards",
    target: "sections.two-column-grid",
    transform: (entry) => {
      const cards = asArray(entry["cards"])

      return {
        section: buildSectionHeader({}),
        items: cards.map((card) => ({
          title: (card["title"] as string) ?? "",
          description: (card["description"] as string) ?? "",
          icon: wrapBasicImage(card["icon"] ?? card["image"]),
        })),
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
        items: benefits.map((b) => ({
          title: (b["title"] as string) ?? "",
          description: (b["description"] as string) ?? "",
          icon: wrapBasicImage(b["icon"] ?? b["image"]),
        })),
      }
    },
  },

  { source: "slices.benefits-header", target: null },
  { source: "slices.icon-with-tooltip", target: null },
  { source: "slices.themed-cards", target: null },

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
      const btn = asRecord(entry["button"])
      const buttons: V4Button[] = btn["label"] ? [btn as V4Button] : []

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
      const btn = asRecord(entry["button"])
      const buttons: V4Button[] = btn["label"] ? [btn as V4Button] : []

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

  // Plan variants
  { source: "slices.large-plan-card", target: null },
  { source: "slices.plan-type-selector", target: null },

  // Contact/demo/form layouts
  { source: "slices.get-demo-info", target: null },
  { source: "slices.get-demo-layout", target: null },
  { source: "slices.next-to-form-section", target: null },
  { source: "slices.contact-header", target: null },
  { source: "slices.contact-form-section", target: null },
  { source: "slices.contact-sales-layout", target: null },

  // Grid/list sections
  { source: "slices.getting-started-grid", target: null },
  { source: "slices.info-cta-grid", target: null },
  { source: "slices.socials-grid", target: null },
  { source: "slices.tech-stack-icon-list", target: null },

  // Misc sections
  { source: "slices.interview", target: null },
  { source: "slices.community-section", target: null },
  { source: "slices.company-stat-list", target: null },
  { source: "slices.company-stat", target: null },
  { source: "slices.event-section", target: null },
  { source: "slices.awards-launch-section", target: null },
  { source: "slices.issues-header", target: null },
  { source: "slices.launch-event", target: null },
  { source: "slices.perk-group", target: null },
  { source: "slices.perk-lists", target: null },
  { source: "slices.perk", target: null },
]
