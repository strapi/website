"use client"

import { useState } from "react"

import { AppLink } from "@/components/elementary/AppLink"
import { Button } from "@/components/ui/button"

export function PageList({
  pages,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pages: any[]
}) {
  const [show, setShow] = useState(true)

  return (
    <div className="flex flex-col gap-6">
      <div className="my-6">
        <Button
          type="button"
          variant={show ? "default" : "outline"}
          onClick={() => setShow((prev) => !prev)}
        >
          {show ? "Hide components" : "Show components"}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {pages?.map((page) => (
          <div key={page.id}>
            <h2 className="text-foreground text-5xl font-bold tracking-tight">
              {page.title}
            </h2>
            <AppLink
              href={page.fullPath ?? ""}
              openInNewTab
              className="mb-2 p-0"
            >
              {page.fullPath}
            </AppLink>
            {show && (
              <div className="pl-4">
                {page?.content?.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (block: any, i: number) => (
                    <p
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${block.id ?? block.__component}-${i}`}
                      className="text-foreground text-lg"
                    >
                      {block.__component}
                    </p>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
