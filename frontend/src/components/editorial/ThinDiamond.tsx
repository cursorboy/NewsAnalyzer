export default function ThinDiamond({
  size = 9,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className={`shrink-0 fill-current ${className}`}
      aria-hidden
    >
      <path d="M7 0 L14 7 L7 14 L0 7 Z" />
    </svg>
  )
}
