import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { Markdown } from "@/components/elementary/markdown/Markdown"
import { DynamicZoneRenderer } from "@/components/page-builder/DynamicZoneRenderer"
import { legalPagePath, type LegalPagePanelEntry } from "@/lib/legal-page-path"
import { Link } from "@/lib/navigation"
import { SECTION_SPACING } from "@/lib/section-spacing"
import { cn } from "@/lib/styles"

import { StrapiRichtext } from "./StrapiRichtext"

type PageSection = {
  __component: string
  id: string | number
  [key: string]: unknown
}

type PanelItem = {
  readonly key: string
  readonly title: string
  readonly href: string
  readonly active: boolean
}

function panelItems({
  pageTitle,
  pagePath,
  legalPages,
  activeSlug,
}: {
  readonly pageTitle: string
  readonly pagePath: string
  readonly legalPages: readonly LegalPagePanelEntry[]
  readonly activeSlug?: string | null
}): PanelItem[] {
  const items: PanelItem[] = [
    {
      key: "host",
      title: pageTitle,
      href: pagePath,
      active: !activeSlug,
    },
  ]

  for (const legalPage of legalPages) {
    if (!legalPage.slug) continue

    items.push({
      key: legalPage.slug,
      title: legalPage.title || legalPage.slug,
      href: legalPagePath(pagePath, legalPage.slug),
      active: legalPage.slug === activeSlug,
    })
  }

  return items
}

function SidePanelLink({ item }: { readonly item: PanelItem }) {
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 text-left text-sm font-medium",
        "transition-[color,translate,padding] duration-300 ease-in-out",
        "text-strapi-gray-700 -translate-x-5 py-1",
        item.active && "text-strapi-blue-600 translate-x-0 py-1",
        "hover:text-strapi-blue-600 hover:translate-x-0"
      )}
    >
      <span className="text-strapi-gray-700/70 h-px w-12 shrink-0 bg-current" />
      <span className="min-w-0 flex-1 wrap-break-word">{item.title}</span>
    </Link>
  )
}

function HostSections({
  sections,
  extraProps,
}: {
  readonly sections: readonly PageSection[]
  readonly extraProps?: Record<string, unknown>
}) {
  const richtext = sections.filter(
    (section) => section.__component === "sections.richtext"
  )
  const rest = sections.filter(
    (section) => section.__component !== "sections.richtext"
  )

  return (
    <>
      {richtext.map((section) => (
        <StrapiRichtext
          key={`${section.__component}-${section.id}`}
          embedded
          component={section as Data.Component<"sections.richtext">}
        />
      ))}
      {rest.length > 0 && (
        <DynamicZoneRenderer
          content={[...rest]}
          itemClassName={SECTION_SPACING}
          surface="page"
          extraProps={extraProps}
        />
      )}
    </>
  )
}

export function StrapiLegalPages({
  component,
  page,
  sections = [],
  activeLegalPage = null,
  extraProps,
}: {
  readonly component: Data.Component<"sections.legal-pages">
  readonly page?: {
    readonly title?: string | null
    readonly fullPath?: string | null
  } | null
  readonly sections?: readonly PageSection[]
  readonly activeLegalPage?: LegalPagePanelEntry | null
  readonly extraProps?: Record<string, unknown>
}) {
  const pagePath = page?.fullPath || "/"
  const pageTitle = page?.title || "Legal"
  const legalPages = (component.legalPages ?? []) as LegalPagePanelEntry[]
  const items = panelItems({
    pageTitle,
    pagePath,
    legalPages,
    activeSlug: activeLegalPage?.slug,
  })

  return (
    <section className="py-8 lg:py-16">
      <Container>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-64">
            <nav aria-label="Legal pages">
              <ul className="flex list-none flex-col gap-2">
                {items.map((item) => (
                  <li key={item.key}>
                    <SidePanelLink item={item} />
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {activeLegalPage?.content ? (
              <Markdown>{activeLegalPage.content}</Markdown>
            ) : (
              <HostSections sections={sections} extraProps={extraProps} />
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
