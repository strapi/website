export interface GithubRepoResponse {
  stargazers_count: number
}

function parseGithubRepoPath(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl)
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null
    }

    const [owner, repo] = url.pathname.split("/").filter(Boolean)
    if (!owner || !repo) {
      return null
    }

    return `${owner}/${repo}`
  } catch {
    return null
  }
}

/**
 * Fetch the number of stars for a GitHub repository.
 * The request is cached for 3 hours.
 */
export async function fetchGithubStars(
  repoUrl: string
): Promise<number | null> {
  const repoPath = parseGithubRepoPath(repoUrl)
  if (repoPath == null) {
    return null
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
      next: { revalidate: 10800 },
      headers: { Accept: "application/vnd.github.v3+json" },
    })

    if (!response.ok) {
      return null
    }

    const data: GithubRepoResponse = await response.json()

    return data.stargazers_count ?? null
  } catch {
    return null
  }
}
