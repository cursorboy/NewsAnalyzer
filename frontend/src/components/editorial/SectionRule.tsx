type Variant = 'single' | 'double' | 'thinThick' | 'thickThin' | 'dots' | 'ornament'

export default function SectionRule({
  variant = 'double',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  if (variant === 'single') {
    return <hr className={`border-0 border-t border-ink/30 ${className}`} />
  }

  if (variant === 'double') {
    return (
      <div className={`relative ${className}`} aria-hidden>
        <div className="border-t border-ink/35" />
        <div className="mt-[3px] border-t border-ink/35" />
      </div>
    )
  }

  if (variant === 'thinThick') {
    return (
      <div className={`relative ${className}`} aria-hidden>
        <div className="border-t border-ink/30" />
        <div className="mt-[3px] h-[3px] bg-ink" />
      </div>
    )
  }

  if (variant === 'thickThin') {
    return (
      <div className={`relative ${className}`} aria-hidden>
        <div className="h-[3px] bg-ink" />
        <div className="mt-[3px] border-t border-ink/30" />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div
        className={`flex items-center justify-center gap-2 text-ink/40 ${className}`}
        aria-hidden
      >
        <span className="block h-[3px] w-[3px] rounded-full bg-current" />
        <span className="block h-[3px] w-[3px] rounded-full bg-current" />
        <span className="block h-[3px] w-[3px] rounded-full bg-current" />
      </div>
    )
  }

  // ornament: thin rule -- diamond -- thin rule, monochrome ink, SVG
  return (
    <div
      className={`flex items-center justify-center gap-3 text-ink/40 ${className}`}
      aria-hidden
    >
      <span className="block h-px w-full max-w-[140px] bg-current" />
      <Fleuron />
      <span className="block h-px w-full max-w-[140px] bg-current" />
    </div>
  )
}

export function Fleuron({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      className={`shrink-0 fill-current ${className}`}
      aria-hidden
    >
      <path d="M12 2 L13.2 8.6 L19.8 9.8 L13.2 11 L12 17.6 L10.8 11 L4.2 9.8 L10.8 8.6 Z" />
      <circle cx="12" cy="20.5" r="0.9" />
    </svg>
  )
}

export function ThinDiamond({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="9"
      height="9"
      className={`shrink-0 fill-current ${className}`}
      aria-hidden
    >
      <path d="M7 0 L14 7 L7 14 L0 7 Z" />
    </svg>
  )
}
