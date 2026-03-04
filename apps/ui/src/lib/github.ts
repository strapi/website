export interface GithubRepoResponse {
  stargazers_count: number
}

/**
 * Fetch the number of stars for the Strapi repository from GitHub.
 * The request is cached for 3 hours.
 */
export async function fetchGithubStars(): Promise<number | null> {
  try {
    const response = await fetch("https://api.github.com/repos/strapi/strapi", {
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
