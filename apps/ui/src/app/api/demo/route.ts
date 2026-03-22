import { after } from "next/server"

import { env } from "@/env.mjs"

export const dynamic = "force-dynamic"

interface DemoRequestBody {
  email: string
  firstName: string
  lastName: string
  duration: number
}

/**
 * Provisions a demo Strapi instance via the operator service,
 * then unenrolls the contact from the HubSpot nurture workflow.
 */
export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as DemoRequestBody | null

  if (!body?.email || !body?.firstName || !body?.lastName) {
    return Response.json(
      { error: "Missing required fields: email, firstName, lastName" },
      { status: 400 }
    )
  }

  const operatorServer = env.DEMO_OPERATOR_SERVER
  const operatorToken = env.DEMO_OPERATOR_TOKEN

  if (!operatorServer || !operatorToken) {
    return Response.json(
      { error: "Demo provisioning is not configured" },
      { status: 503 }
    )
  }

  const durationSeconds = (body.duration ?? 8) * 60 * 60

  try {
    // Create demo instance via operator
    const res = await fetch(`${operatorServer}/environments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        duration: durationSeconds,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error")
      console.error("[Demo API] Operator error:", res.status, errorText)

      return Response.json(
        { error: "Failed to create demo instance" },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Unenroll from HubSpot workflow after the response is sent
    const hubspotToken = env.HUBSPOT_API_TOKEN

    if (hubspotToken && body.email) {
      const workflowId = env.HUBSPOT_DEMO_WORKFLOW_ID ?? "37892286"

      after(async () => {
        try {
          await fetch(
            `https://api.hubapi.com/automation/v2/workflows/${workflowId}/enrollments/contacts/${encodeURIComponent(body.email)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${hubspotToken}`,
              },
            }
          )
        } catch {
          console.warn("[Demo API] Failed to unenroll from HubSpot workflow")
        }
      })
    }

    return Response.json({
      links: {
        backend: data.backend,
        frontend: data.frontend,
      },
    })
  } catch (error) {
    console.error("[Demo API] Error:", error)

    return Response.json({ error: "Demo provisioning failed" }, { status: 500 })
  }
}
