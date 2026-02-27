import { useId } from "react"

export function GreenBottomLeftPattern() {
  const id = useId()
  const b0 = `${id}b0`
  const b1 = `${id}b1`

  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0 z-0"
      width="174"
      height="139"
      viewBox="0 0 174 139"
      fill="none"
      aria-hidden
    >
      <g opacity="0.4">
        <ellipse
          rx="34.7988"
          ry="34.73"
          transform="matrix(-1 0 0 1 69.6016 104.189)"
          fill="#22A66B"
        />
        <rect
          width="34.7988"
          height="34.73"
          transform="matrix(-1 0 0 1 34.8018 104.189)"
          fill="#21C47B"
        />
        <mask
          id={b0}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="104"
          width="35"
          height="35"
        >
          <rect
            width="34.7988"
            height="34.73"
            transform="matrix(-1 0 0 1 34.8018 104.189)"
            fill="#1B0255"
          />
        </mask>
        <g mask={`url(#${b0})`}>
          <ellipse
            rx="34.7988"
            ry="34.73"
            transform="matrix(-1 0 0 1 34.8043 138.919)"
            fill="#0F8D55"
          />
        </g>
        <rect
          x="69.5986"
          y="104.189"
          width="34.7988"
          height="34.73"
          fill="#21C47B"
        />
        <mask
          id={b1}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="69"
          y="104"
          width="36"
          height="35"
        >
          <rect
            x="69.5986"
            y="104.189"
            width="34.7988"
            height="34.73"
            fill="#1B0255"
          />
        </mask>
        <g mask={`url(#${b1})`}>
          <ellipse
            cx="69.5966"
            cy="138.919"
            rx="34.7988"
            ry="34.73"
            fill="#0F8D55"
          />
        </g>
        <rect
          width="34.7988"
          height="34.73"
          transform="matrix(-1 0 0 1 34.8018 0)"
          fill="#21C47B"
        />
        <path d="M0.00298309 0V34.73H34.8018L0.00298309 0Z" fill="#0F8D55" />
        <rect
          width="34.7988"
          height="34.73"
          transform="matrix(-1 0 0 1 104.396 34.7297)"
          fill="#21C47B"
        />
        <path
          d="M69.5967 34.7297V69.4597H104.396L69.5967 34.7297Z"
          fill="#0F8D55"
        />
        <rect
          x="139.197"
          y="104.189"
          width="34.7988"
          height="34.73"
          fill="#22A66B"
        />
        <path
          d="M173.996 104.189V138.919H139.197L173.996 104.189Z"
          fill="#21C47B"
        />
        <rect x="69.5986" width="34.7988" height="34.73" fill="#18BB72" />
        <rect
          x="34.8018"
          y="69.4594"
          width="34.7988"
          height="34.73"
          transform="rotate(-180 34.8018 69.4594)"
          fill="#22A66B"
        />
        <rect
          x="34.8008"
          y="52.0936"
          width="17.3994"
          height="17.365"
          transform="rotate(-180 34.8008 52.0936)"
          fill="#21C47B"
        />
        <rect
          x="139.197"
          y="86.8256"
          width="17.3994"
          height="17.365"
          transform="rotate(-180 139.197 86.8256)"
          fill="#21C47B"
        />
        <rect
          x="104.396"
          y="104.189"
          width="34.7988"
          height="34.73"
          fill="#21C47B"
        />
        <rect x="34.8018" width="34.7988" height="34.73" fill="#21C47B" />
        <rect
          x="69.5986"
          y="69.4594"
          width="34.7988"
          height="34.73"
          fill="#21C47B"
        />
        <rect y="69.4594" width="34.7988" height="34.73" fill="#36D68F" />
        <rect
          x="34.8018"
          y="104.189"
          width="34.7988"
          height="34.73"
          fill="#22A66B"
        />
        <ellipse
          cx="52.2011"
          cy="121.554"
          rx="17.3994"
          ry="17.365"
          fill="#21C47B"
        />
        <ellipse
          cx="52.1994"
          cy="121.553"
          rx="7.73306"
          ry="7.71778"
          fill="#36D68F"
        />
      </g>
    </svg>
  )
}
