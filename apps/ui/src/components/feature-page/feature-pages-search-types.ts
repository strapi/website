export interface FeatureIconMedia {
  readonly url?: string
  readonly alternativeText?: string | null
  readonly width?: number
  readonly height?: number
}

export interface FeaturePageHit {
  readonly id?: number
  readonly documentId?: string
  readonly title: string
  readonly description?: string | null
  readonly url?: string | null
  readonly feature_tag?: string | null
  readonly icon?: FeatureIconMedia | null
  readonly locale?: string
  readonly [key: string]: unknown
}

export interface FeaturePagesSearchResult {
  readonly hits: readonly FeaturePageHit[]
  readonly total: number
}

export interface SearchFeaturePagesArgs {
  readonly locale: string
  readonly query: string
  readonly featureTagTitles: readonly string[]
  readonly offset: number
  readonly limit: number
}
