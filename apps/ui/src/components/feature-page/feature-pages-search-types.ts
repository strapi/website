export interface FeaturePageHit {
  readonly id?: number
  readonly documentId?: string
  readonly slug: string
  readonly title: string
  readonly fullPath: string
  readonly locale?: string
  readonly pageType?: string
  readonly [key: string]: unknown
}

export interface FeaturePagesSearchResult {
  readonly hits: readonly FeaturePageHit[]
  readonly total: number
}

export interface SearchFeaturePagesArgs {
  readonly locale: string
  readonly query: string
  readonly offset: number
  readonly limit: number
}
