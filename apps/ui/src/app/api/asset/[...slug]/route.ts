import { NextResponse } from "next/server"

import { getEnvVar } from "@/lib/env-vars"

/**
 * This route handler allows asset fetching from Strapi backend even from client-side components,
 * that cannot know the URL of Strapi.
 *
 * Using AWS S3 or similar bucket will provide you with absolute path for the resource, however
 * Strapi might be used with local storage too. This means, that URLs from assets are being fetched with relative paths.
 *
 * @param request fetch request
 * @param anonymous query parameters of the request
 */

export const revalidate = false

function detectImageMimeFromBytes(bytes: Uint8Array): string | undefined {
  const hasPrefix = (prefix: number[]) =>
    prefix.every((value, index) => bytes[index] === value)

  if (
    bytes.length >= 8 &&
    hasPrefix([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png"
  }

  if (bytes.length >= 3 && hasPrefix([0xff, 0xd8, 0xff])) {
    return "image/jpeg"
  }

  if (bytes.length >= 4 && hasPrefix([0x47, 0x49, 0x46, 0x38])) {
    return "image/gif"
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }

  return undefined
}

async function handler(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const path = Array.isArray(slug) ? slug.join("/") : slug

  if (!path.startsWith("uploads/")) {
    // allow only uploads to be fetched through this proxy
    return NextResponse.json(
      {
        error: {
          message: `Access denied: Only paths under uploads/ are allowed`,
          name: "Forbidden",
        },
      },
      { status: 403 }
    )
  }

  const strapiUrl = getEnvVar("STRAPI_URL", true)
  const { search } = new URL(request.url)
  const url = `${strapiUrl!}/${path}${search ?? ""}`
  const clonedRequest = request.clone()

  const { url: _, ...rest } = clonedRequest
  const response = await fetch(url, {
    ...rest,
  })

  // Built-in fetch in Node.js may decompress response bodies, so drop stale encoding/length headers.
  const headers = new Headers(response.headers)
  headers.delete("content-encoding")
  headers.delete("content-length")

  // Some legacy uploads are stored as PNG/JPEG while their filename keeps .svg.
  // Sniff those payloads and override MIME so browsers render them instead of parsing as XML.
  if (path.toLowerCase().endsWith(".svg")) {
    const clonedResponse = response.clone()
    const buffer = await clonedResponse.arrayBuffer()
    const detectedMime = detectImageMimeFromBytes(new Uint8Array(buffer))
    if (detectedMime && detectedMime !== "image/svg+xml") {
      headers.set("content-type", detectedMime)
    }
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}

export { handler as GET }
