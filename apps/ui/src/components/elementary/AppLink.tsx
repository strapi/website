import type { VariantProps } from "class-variance-authority"
import type React from "react"

import { buttonVariants } from "@/components/ui/button"
import { formatHref, isAppLink, Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

export interface AppLinkProps
  extends
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  readonly href: string
  readonly children?: React.ReactNode
  readonly openInNewTab?: boolean
  readonly startAdornment?: React.ReactNode
  readonly endAdornment?: React.ReactNode
  readonly adornmentClassName?: string
  readonly ref?: React.Ref<HTMLAnchorElement>
}

export function AppLink({
  href,
  className,
  children,
  endAdornment,
  startAdornment,
  adornmentClassName,
  openInNewTab = false,
  variant = "default",
  size = "default",
  ref,
  ...props
}: AppLinkProps) {
  const combinedClassName = cn(
    "group flex flex-row items-center gap-2",
    buttonVariants({ variant, size }),
    className
  )

  const formattedHref = formatHref(href)

  const AppLinkInner = (
    <>
      {startAdornment && (
        <span className={cn("relative size-4", adornmentClassName)}>
          {startAdornment}
        </span>
      )}
      {children}
      {endAdornment && (
        <span className={cn("relative size-4", adornmentClassName)}>
          {endAdornment}
        </span>
      )}
    </>
  )

  if (isAppLink(formattedHref)) {
    return (
      <Link
        ref={ref}
        href={formattedHref}
        {...props}
        target={openInNewTab ? "_blank" : ""}
        rel={openInNewTab ? "noopener" : ""}
        className={combinedClassName}
      >
        {AppLinkInner}
      </Link>
    )
  }

  return (
    <a
      ref={ref}
      href={formattedHref}
      {...props}
      target={openInNewTab ? "_blank" : ""}
      rel={openInNewTab ? "noopener noreferrer" : ""}
      className={combinedClassName}
    >
      {AppLinkInner}
    </a>
  )
}
