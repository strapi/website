import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr"

import { removeThisWhenYouNeedMe } from "@/lib/general-helpers"

export function AdornmentSuccess() {
  removeThisWhenYouNeedMe("AdornmentSuccess")

  return (
    <span>
      <CheckIcon size="1.5rem" weight="bold" />
    </span>
  )
}

export function AdornmentError() {
  removeThisWhenYouNeedMe("AdornmentError")

  return (
    <span>
      <XIcon size="1.5rem" weight="bold" />
    </span>
  )
}
