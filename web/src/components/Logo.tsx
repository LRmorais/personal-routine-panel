import { useId } from 'react'

/** App mark: progress ring with an amber tip and a check, on a violet→fuchsia tile. */
export function Logo({ size = 36 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Ritmo" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="7.5" />
      <path
        d="M 50 23 A 27 27 0 1 1 26.6 36.5"
        fill="none"
        stroke="#fff"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <circle cx="26.6" cy="36.5" r="3.75" fill="#fdba3c" />
      <path d="M 39.5 50.5 L 47 58.5 L 61.5 41.5" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
