import type { Data } from "@repo/strapi-types"

import { Container } from "@/components/elementary/Container"
import {
  SectionDescription,
  SectionHeader,
  SectionLabel,
  SectionTitle,
} from "@/components/elementary/section-header"

import { ReviewCard } from "./ReviewCard"

export function StrapiReviews({
  component,
}: {
  readonly component: Data.Component<"sections.reviews">
}) {
  const { subTitle, title, description, reviews } = component

  if (!reviews || reviews.length === 0) {
    return null
  }

  return (
    <section className="py-20 lg:py-30">
      <Container>
        <SectionHeader size="default" layout="center">
          {subTitle && <SectionLabel variant="purple">{subTitle}</SectionLabel>}
          <SectionTitle as="h2">{title}</SectionTitle>
          {description && (
            <SectionDescription>{description}</SectionDescription>
          )}
        </SectionHeader>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Container>
    </section>
  )
}
