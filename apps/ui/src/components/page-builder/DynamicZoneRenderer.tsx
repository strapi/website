import type { UID } from "@repo/strapi-types"

import { ErrorBoundary } from "@/components/elementary/ErrorBoundary"
import { cn } from "@/lib/styles"

import { ContentComponents } from "./index"

interface DynamicZoneItem {
  __component: string
  id: string | number
  [key: string]: unknown
}

interface DynamicZoneRendererProps {
  readonly content: DynamicZoneItem[]
  readonly registry?: Partial<Record<UID.Component, React.ComponentType<any>>>
  readonly itemClassName?: string
  readonly extraProps?: Record<string, unknown>
}

export function DynamicZoneRenderer({
  content,
  registry = ContentComponents,
  itemClassName,
  extraProps,
}: DynamicZoneRendererProps) {
  return content
    .filter((comp) => comp != null)
    .map((comp) => {
      const name = comp.__component as UID.Component
      const id = comp.id
      const key = `${name}-${id}`
      const Component = registry[name]

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
            <div className={cn(itemClassName)}>
              <Component component={comp} {...extraProps} />
            </div>
          ) : (
            <Component component={comp} {...extraProps} />
          )}
        </ErrorBoundary>
      )
    })
}
