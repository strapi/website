export interface CaseStudyHit {
  readonly id?: number
  readonly documentId?: string
  readonly slug: string
  readonly title: string
  readonly companyName?: string | null
  readonly description?: string | null
  readonly originalPublishedAt?: string | null
  readonly locale?: string
  readonly coverImage?: { readonly image?: unknown } | null
  readonly categories?:
    | readonly {
        readonly name?: string
        readonly slug?: string
      }[]
    | null
  readonly [key: string]: unknown
}

export interface CaseStudiesSearchResult {
  readonly hits: readonly CaseStudyHit[]
  readonly total: number
}

export interface SearchCaseStudiesArgs {
  readonly locale: string
  readonly query: string
  readonly categorySlugs: readonly string[]
  readonly offset: number
  readonly limit: number
}
