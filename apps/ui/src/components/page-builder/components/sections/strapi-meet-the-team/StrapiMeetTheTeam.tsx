"use client"

import type { Data } from "@repo/strapi-types"
import { useMemo, useState } from "react"

import { Container } from "@/components/elementary/Container"
import {
  SectionHeader,
  SectionTitle,
} from "@/components/elementary/section-header"
import { StrapiBasicImage } from "@/components/page-builder/components/utilities/StrapiBasicImage"
import { StrapiLinkText } from "@/components/page-builder/components/utilities/StrapiLinkText"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TeamMemberCard } from "./TeamMemberCard"

const ALL_TEAMS = "__all__"

export function StrapiMeetTheTeam({
  component,
}: {
  readonly component: Data.Component<"sections.meet-the-team">
}) {
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_TEAMS)
  const [selectedMember, setSelectedMember] =
    useState<Data.Component<"elements.team-member-item"> | null>(null)

  const departments = useMemo(() => {
    if (!component.items) return []

    const set = new Set<string>()

    for (const item of component.items) {
      if (item.department) {
        set.add(item.department)
      }
    }

    return Array.from(set).sort()
  }, [component.items])

  const filteredItems = useMemo(() => {
    if (!component.items) return []
    if (selectedDepartment === ALL_TEAMS) return component.items

    return component.items.filter(
      (item) => item.department === selectedDepartment
    )
  }, [component.items, selectedDepartment])

  return (
    <section className="py-16 lg:py-24">
      <Container>
        <SectionHeader layout="center" size="default">
          <SectionTitle as="h2" size="default">
            {component.section?.title}
          </SectionTitle>
        </SectionHeader>

        {departments.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-auto min-w-40">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TEAMS}>All teams</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <TeamMemberCard
              key={item.id}
              item={item}
              onClick={() => setSelectedMember(item)}
            />
          ))}

          {component.ctaTitle && (
            <Card className="bg-strapi-blue-800 flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <h3 className="text-xl font-bold text-white">
                  {component.ctaTitle}
                </h3>
                {component.ctaLink && (
                  <StrapiLinkText
                    component={component.ctaLink}
                    className="text-strapi-purple-400 text-sm font-semibold hover:underline"
                  />
                )}
              </div>
            </Card>
          )}
        </div>
      </Container>

      <Dialog
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null)
        }}
      >
        <DialogContent
          showCloseButton
          className="flex max-w-90 flex-col gap-0 overflow-hidden border-none p-0 sm:max-w-3xl sm:flex-row"
        >
          {selectedMember && (
            <>
              <div className="bg-strapi-neutral-100 relative aspect-4/5 w-full shrink-0 sm:w-[44%]">
                <StrapiBasicImage
                  component={selectedMember.image}
                  mode="fill"
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                  hideWhenMissing
                  decorative
                />
              </div>

              <div className="flex flex-col gap-1 p-8 sm:p-10 sm:py-14">
                <DialogTitle className="text-strapi-blue-800 text-xl font-semibold">
                  {selectedMember.name}
                </DialogTitle>
                <DialogDescription className="text-strapi-purple-600 text-lg">
                  {selectedMember.role}
                </DialogDescription>

                {selectedMember.location && (
                  <p className="text-strapi-neutral-800 mt-1 text-lg">
                    📍 {selectedMember.location}
                  </p>
                )}

                {selectedMember.bio && (
                  <p className="mt-2 text-sm leading-relaxed">
                    {selectedMember.bio}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
