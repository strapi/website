"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import { useEffect, useState } from "react"

import { GlobalSearchModal } from "@/components/elementary/GlobalSearchModal"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        aria-label="Open search"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center justify-center transition-colors"
      >
        <MagnifyingGlassIcon className="size-6" />
      </button>
      <GlobalSearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}
