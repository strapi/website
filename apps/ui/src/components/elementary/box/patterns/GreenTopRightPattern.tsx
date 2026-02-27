import { useId } from "react"

export function GreenTopRightPattern() {
  const id = useId()
  const t0 = `${id}t0`
  const t1 = `${id}t1`

  return (
    <svg
      className="pointer-events-none absolute top-0 right-0 z-0"
      width="169"
      height="236"
      viewBox="0 0 169 236"
      fill="none"
      aria-hidden
    >
      <g opacity="0.4">
        <rect x="34.0586" width="33.7026" height="33.636" fill="#26AF72" />
        <mask
          id={t0}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="34"
          y="0"
          width="34"
          height="34"
        >
          <rect x="34.0586" width="33.7026" height="33.636" fill="#1B0255" />
        </mask>
        <g mask={`url(#${t0})`}>
          <ellipse
            cx="34.0557"
            cy="33.636"
            rx="33.7026"
            ry="33.636"
            fill="#0F8D55"
          />
        </g>
        <rect
          x="135.163"
          y="100.909"
          width="33.7026"
          height="33.636"
          fill="#26AF72"
        />
        <mask
          id={t1}
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="135"
          y="100"
          width="34"
          height="35"
        >
          <rect
            x="135.163"
            y="100.909"
            width="33.7026"
            height="33.636"
            fill="#1B0255"
          />
        </mask>
        <g mask={`url(#${t1})`}>
          <ellipse
            cx="135.165"
            cy="134.545"
            rx="33.7026"
            ry="33.636"
            fill="#0F8D55"
          />
        </g>
        <rect
          x="67.7529"
          y="134.544"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <path
          d="M101.456 134.544V168.18H67.7529L101.456 134.544Z"
          fill="#18BB72"
        />
        <rect x="0.354492" width="33.7026" height="33.636" fill="#1AC176" />
        <path d="M34.0571 0V33.636H0.354492L34.0571 0Z" fill="#18BB72" />
        <rect
          x="67.7529"
          y="168.179"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <path
          d="M101.456 168.179V201.815H67.7529L101.456 168.179Z"
          fill="#18BB72"
        />
        <rect
          x="135.163"
          y="168.179"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <path
          d="M168.865 168.179V201.815H135.163L168.865 168.179Z"
          fill="#18BB72"
        />
        <rect
          x="101.458"
          y="201.817"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <path
          d="M135.16 201.817V235.453H101.458L135.16 201.817Z"
          fill="#18BB72"
        />
        <rect x="67.7529" width="33.7026" height="33.636" fill="#26AF72" />
        <path d="M101.456 0V33.636H67.7529L101.456 0Z" fill="#0F8D55" />
        <rect
          x="168.868"
          y="100.909"
          width="33.7026"
          height="33.636"
          transform="rotate(-180 168.868 100.909)"
          fill="#26AF72"
        />
        <path
          d="M135.165 100.909V67.2727H168.868L135.165 100.909Z"
          fill="#0F8D55"
        />
        <rect x="101.458" width="33.7026" height="33.636" fill="#18BB72" />
        <rect x="135.163" width="33.7026" height="33.636" fill="#0F8D55" />
        <rect
          x="135.163"
          y="33.6354"
          width="33.7026"
          height="33.636"
          fill="#18BB72"
        />
        <rect
          x="101.458"
          y="33.6354"
          width="33.7026"
          height="33.636"
          fill="#36D68F"
        />
        <rect
          x="67.7529"
          y="33.6354"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <rect
          x="101.463"
          y="100.909"
          width="33.7026"
          height="33.636"
          fill="#1AC176"
        />
        <rect
          x="135.157"
          y="134.544"
          width="33.7026"
          height="33.636"
          fill="#36D68F"
        />
      </g>
    </svg>
  )
}
