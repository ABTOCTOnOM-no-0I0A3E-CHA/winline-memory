import type { HTMLAttributes } from 'react'

export default function Rectangle({ ...props }: HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      width="54"
      height="20"
      viewBox="0 0 54 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      {...props}
    >
      <path d="M8.72951 0H53.25L44.5205 20H0L8.72951 0Z" fill="currentColor" />
    </svg>
  )
}
