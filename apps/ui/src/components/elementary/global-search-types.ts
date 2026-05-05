export interface CaseStudyGlobalHit {
  readonly slug: string
  readonly title: string
  readonly companyName?: string | null
}

export interface PageGlobalHit {
  readonly slug: string
  readonly title: string
  readonly fullPath: string
  readonly pageType?: string
}

export interface BlogPostGlobalHit {
  readonly slug: string
  readonly title: string
  readonly description?: string | null
}

export interface GlobalSearchResult {
  readonly caseStudies: readonly CaseStudyGlobalHit[]
  readonly pages: readonly PageGlobalHit[]
  readonly blogPosts: readonly BlogPostGlobalHit[]
}
