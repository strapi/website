import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import { CookieDeclaration } from "@/components/elementary/cookie-declaration/CookieDeclaration"
import { env } from "@/env.mjs"

export function StrapiCookieDeclaration({
  component,
}: {
  readonly component: Data.Component<"sections.cookie-declaration">
}) {
  // COOKIEBOT_ID is a server-only env var; pass it down to the client component.
  const cbid = env.COOKIEBOT_ID
  if (!cbid) return null

  return (
    <section>
      <Container>
        {component.title ? (
          <h2 className="mb-6 text-2xl font-semibold">{component.title}</h2>
        ) : null}
        <CookieDeclaration cbid={cbid} />
      </Container>
    </section>
  )
}
