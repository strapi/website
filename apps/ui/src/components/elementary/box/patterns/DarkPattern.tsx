import Image from "next/image"

import sectionBackground from "./section-background.webp"

export function DarkPattern() {
  return (
    <Image
      src={sectionBackground}
      alt=""
      aria-hidden
      fill
      className="pointer-events-none absolute z-0 object-cover"
    />
  )
}
