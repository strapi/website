import { GithubIcon } from "@/components/icons"
import { cn } from "@/lib/styles"

function formatStars(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
}

interface GithubStarButtonProps extends React.ComponentProps<"a"> {
  readonly stars: number | null
}

export function GithubStarButton({
  stars,
  className,
  ...restProps
}: GithubStarButtonProps) {
  if (stars == null) {
    return null
  }

  return (
    <a
      href="https://github.com/strapi/strapi/stargazers"
      target="_blank"
      rel="noreferrer"
      className={cn(
        "animate-spring flex items-center gap-1.5 p-4 text-sm",
        className
      )}
      {...restProps}
    >
      <GithubIcon className="size-6" />
      <span className="text-base text-inherit">{formatStars(stars)}</span>
    </a>
  )
}
