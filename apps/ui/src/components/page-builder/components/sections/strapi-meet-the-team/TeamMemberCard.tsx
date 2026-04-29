import type { Data } from "@repo/strapi-types"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { Card, CardContent, CardImage } from "@/components/ui/card"

interface TeamMemberCardProps {
  readonly item: Data.Component<"elements.team-member-item">
  readonly onClick?: () => void
}

export function TeamMemberCard({ item, onClick }: TeamMemberCardProps) {
  return (
    <Card
      className="hover:animate-spring-sm cursor-pointer gap-0 p-0 transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <CardImage className="aspect-241/286">
        <StrapiBasicImage
          component={item.image}
          mode="fill"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          hideWhenMissing
          decorative
        />
      </CardImage>

      <CardContent className="gap-1 p-4">
        <p className="text-strapi-blue-700 text-lg font-semibold">
          {item.name}
        </p>
        <p className="text-strapi-purple-600 text-sm">{item.role}</p>
      </CardContent>
    </Card>
  )
}
