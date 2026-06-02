import type { HTMLAttributes } from 'react'

export default function RectangleSmall({ ...props }: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1.96721 0H12L10.0328 10H0L1.96721 0Z" fill="currentColor" />
    </svg>
  )
}
