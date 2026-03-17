export interface MigrationEnv {
  source: {
    baseUrl: string
    token: string
  }
  target: {
    baseUrl: string
    token: string
  }
}

export function loadEnv(): MigrationEnv {
  const sourceUrl = process.env["SOURCE_URL"]
  const sourceToken = process.env["SOURCE_TOKEN"]
  const targetUrl = process.env["TARGET_URL"]
  const targetToken = process.env["TARGET_TOKEN"]

  if (!sourceUrl || !sourceToken) {
    throw new Error("Missing SOURCE_URL or SOURCE_TOKEN environment variables")
  }

  if (!targetUrl || !targetToken) {
    throw new Error("Missing TARGET_URL or TARGET_TOKEN environment variables")
  }

  return {
    source: {
      baseUrl: sourceUrl.replace(/\/$/, ""),
      token: sourceToken,
    },
    target: {
      baseUrl: targetUrl.replace(/\/$/, ""),
      token: targetToken,
    },
  }
}
