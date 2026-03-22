interface DemoLinkProps {
  readonly label: string
  readonly href: string
}

export function DemoLink({ label, href }: DemoLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border-strapi-neutral-200 hover:border-strapi-blue-300 hover:bg-strapi-blue-50 flex items-center justify-between rounded-lg border p-3 transition-colors"
    >
      <span className="text-foreground text-sm font-medium">{label}</span>
      <span className="text-strapi-blue-600 text-sm">{href}</span>
    </a>
  )
}
