// Cursor-following spotlight card. Adapted from 21st.dev's SpotlightCard.
// A 600px radial-gradient blob tracks the mouse position over the card and
// fades in/out on enter/leave. Theme: editorial — paper card with ink border,
// accent-tinted spotlight.
//
// Adaptations:
//  • Plain className concat (no cn util)
//  • Default spotlight color uses the project accent (rgba 185/28/28)
//  • Hard edges, no rounded corners — to match the newspaper aesthetic

import { useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react'

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  spotlightColor?: string
  spotlightSize?: number
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(185, 28, 28, 0.15)',
  spotlightSize = 600,
  ...props
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className ?? ''}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 45%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
