import type { UID } from "@repo/strapi-types"

import { ErrorBoundary } from "@/components/elementary/ErrorBoundary"
import { cn } from "@/lib/styles"

import { ContentComponents } from "./index"

interface DynamicZoneItem {
  __component: string
  id: string | number
  [key: string]: unknown
}

export interface DynamicZoneRenderContext {
  readonly index: number
  readonly isFirst: boolean
  readonly surface: "footer" | "header" | "page"
  readonly total: number
}

interface DynamicZoneRendererProps {
  readonly content: DynamicZoneItem[]
  readonly registry?: Partial<Record<UID.Component, React.ComponentType<any>>>
  readonly itemClassName?: string
  readonly extraProps?: Record<string, unknown>
  readonly surface?: DynamicZoneRenderContext["surface"]
}

export function DynamicZoneRenderer({
  content,
  registry = ContentComponents,
  itemClassName,
  extraProps,
  surface = "page",
}: DynamicZoneRendererProps) {
  const filteredContent = content.filter((comp) => comp != null)

  return filteredContent.map((comp, index) => {
    const name = comp.__component as UID.Component
    const id = comp.id
    const key = `${name}-${id}`
    const Component = registry[name]
    const renderContext: DynamicZoneRenderContext = {
      index,
      isFirst: index === 0,
      surface,
      total: filteredContent.length,
    }
    const componentProps = {
      ...extraProps,
      renderContext,
    }

    if (Component == null) {
      console.warn(`Unknown component "${name}" with id "${id}".`)

      return (
        <div key={key} className="font-medium text-red-500">
          Component &quot;{key}&quot; is not implemented on the frontend.
        </div>
      )
    }

    return (
      <ErrorBoundary key={key}>
        {itemClassName ? (
          <div className={cn(itemClassName)} data-component={name}>
            <Component component={comp} {...componentProps} />
          </div>
        ) : (
          <Component component={comp} {...componentProps} />
        )}
      </ErrorBoundary>
    )
  })
}
