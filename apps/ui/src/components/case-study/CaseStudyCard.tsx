import { ArrowRightIcon } from "@phosphor-icons/react/ssr"
import type { Data } from "@repo/strapi-types"
import { useTranslations } from "next-intl"

import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import {
  Card,
  CardContent,
  CardFooter,
  CardImage,
  CardLabel,
} from "@/components/ui/card"
import { Link } from "@/lib/navigation"

type CaseStudy = Data.ContentType<"api::case-study.case-study">

interface CaseStudyCardProps {
  readonly caseStudy: CaseStudy
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  const t = useTranslations("caseStudies")

  return (
    <Card>
      <Link
        href={`/user-stories/${caseStudy.slug}`}
        className="group flex h-full flex-col no-underline"
      >
        <CardImage className="aspect-video w-full">
          {caseStudy.coverImage?.image ? (
            <StrapiBasicImage
              component={caseStudy.coverImage.image}
              mode="fill"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gray-200" />
          )}
        </CardImage>

        <CardContent>
          {caseStudy.logoImage?.image && (
            <StrapiBasicImage
              component={caseStudy.logoImage.image}
              mode="responsive"
              className="mb-2 h-8 w-auto object-contain"
              sizes="120px"
              hideWhenMissing
              decorative
            />
          )}

          {caseStudy.companyName && (
            <CardLabel>{caseStudy.companyName}</CardLabel>
          )}

          <h3 className="text-foreground text-lg font-bold">
            {caseStudy.title}
          </h3>
        </CardContent>

        <CardFooter>
          <span className="text-strapi-blue-600 group-hover:text-strapi-blue-700 inline-flex items-center gap-1 text-sm font-medium transition-colors">
            {t("readStory")}
            <ArrowRightIcon className="size-4" />
          </span>
        </CardFooter>
      </Link>
    </Card>
  )
}
