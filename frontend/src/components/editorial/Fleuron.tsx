export default function Fleuron({
  size = 14,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 fill-current ${className}`}
      aria-hidden
    >
      <path d="M12 2 L13.2 8.6 L19.8 9.8 L13.2 11 L12 17.6 L10.8 11 L4.2 9.8 L10.8 8.6 Z" />
      <circle cx="12" cy="20.5" r="0.9" />
    </svg>
  )
}
