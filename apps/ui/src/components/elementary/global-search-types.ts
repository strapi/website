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

export interface FeatureGlobalHit {
  readonly title: string
  readonly description?: string | null
  readonly url?: string | null
  readonly feature_category?: string | null
}

export interface DocsGlobalHit {
  readonly url: string
  readonly hierarchy_lvl0?: string | null
  readonly hierarchy_lvl1?: string | null
  readonly hierarchy_lvl2?: string | null
  readonly hierarchy_lvl3?: string | null
  readonly anchor?: string | null
}

export interface GlobalSearchResult {
  readonly caseStudies: readonly CaseStudyGlobalHit[]
  readonly pages: readonly PageGlobalHit[]
  readonly blogPosts: readonly BlogPostGlobalHit[]
  readonly features: readonly FeatureGlobalHit[]
  readonly docs: readonly DocsGlobalHit[]
}
