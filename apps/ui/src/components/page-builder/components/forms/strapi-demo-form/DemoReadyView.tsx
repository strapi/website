import { CheckCircle } from "@phosphor-icons/react"

import { DemoLink } from "./DemoLink"
import type { DemoResult } from "./useDemoRequest"

const DEMO_EMAIL = "admin@strapidemo.com"
const DEMO_PASSWORD = "welcomeToStrapi123"

interface DemoReadyViewProps {
  readonly result: DemoResult
  readonly title?: string | null
  readonly description?: string | null
}

export function DemoReadyView({
  result,
  title,
  description,
}: DemoReadyViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <CheckCircle
          className="text-strapi-green-600 mt-0.5 size-6 shrink-0"
          weight="fill"
        />
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            {title ?? "Your demo is ready!"}
          </h3>
          <p className="text-strapi-neutral-600 mt-1 text-sm">
            {description ?? "Access your hosted Strapi instance:"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <DemoLink label="Strapi Admin" href={`${result.backendUrl}/admin`} />
        <DemoLink label="Frontend" href={result.frontendUrl} />
      </div>

      <div className="bg-strapi-neutral-100 rounded-lg p-4">
        <p className="text-strapi-neutral-600 mb-2 text-xs font-medium tracking-wider uppercase">
          Credentials
        </p>
        <p className="text-foreground text-sm">
          <span className="font-medium">Email:</span> {DEMO_EMAIL}
        </p>
        <p className="text-foreground text-sm">
          <span className="font-medium">Password:</span> {DEMO_PASSWORD}
        </p>
      </div>
    </div>
  )
}
