import { formatHref, isAppLink, Link } from "@/lib/navigation"
import { cn } from "@/lib/styles"

const pillItemStyles = (active?: boolean, className?: string) =>
  cn(
    "rounded-strapi-md px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer",
    active
      ? "bg-white text-foreground"
      : "text-strapi-blue-500 hover:text-strapi-blue-700",
    className
  )

export function PillGroup({
  className,
  ...restProps
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-strapi-blue-200 rounded-strapi-lg inline-flex gap-1 p-1",
        className
      )}
      {...restProps}
    />
  )
}

export interface PillGroupItemProps extends React.ComponentProps<"button"> {
  readonly active?: boolean
}

export function PillGroupItem({
  active,
  className,
  ...restProps
}: PillGroupItemProps) {
  return (
    <button
      type="button"
      className={pillItemStyles(active, className)}
      {...restProps}
    />
  )
}

export interface PillGroupLinkProps {
  readonly children: React.ReactNode
  readonly active?: boolean
  readonly openInNewTab?: boolean
  readonly className?: string
  readonly href: string
}

export function PillGroupLink({
  children,
  active,
  href,
  openInNewTab,
  className,
}: PillGroupLinkProps) {
  const formattedHref = formatHref(href)

  if (isAppLink(formattedHref)) {
    return (
      <Link
        target={openInNewTab ? "_blank" : ""}
        rel={openInNewTab ? "noopener" : ""}
        href={formattedHref}
        className={pillItemStyles(active, className)}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      target={openInNewTab ? "_blank" : ""}
      rel={openInNewTab ? "noopener noreferrer" : ""}
      href={formattedHref}
      className={pillItemStyles(active, className)}
    >
      {children}
    </a>
  )
}
