// Slot-machine style number counter. Adapted from 21st.dev's "Animated Counter".
// Each digit is its own rolling reel — animates from the current value to the
// target with a spring. Tabular numbers so the width never jitters as digits
// change.
//
// Adaptations from upstream:
//  • `motion/react` → `framer-motion`
//  • Dropped `tailwind-merge`/`clsx` — accept plain `className`
//  • Animation triggers on viewport entry (not on mount) so the counter rolls
//    when the user actually sees it
//  • Supports a `suffix` (e.g. "M", "%", "k") for formatted display

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

interface AnimatedCounterProps {
  end: number
  duration?: number
  className?: string
  fontSize?: number
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({
  end,
  duration = 1.2,
  className,
  fontSize = 40,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [value, setValue] = useState(0)
  const padding = fontSize * 0.18
  const height = fontSize + padding

  useEffect(() => {
    if (!inView) return
    const steps = Math.max(end, 1)
    const tickMs = (duration * 1000) / steps
    let current = 0
    const id = window.setInterval(() => {
      current += 1
      setValue(current)
      if (current >= end) window.clearInterval(id)
    }, Math.max(tickMs, 8))
    return () => window.clearInterval(id)
  }, [inView, end, duration])

  // Build the digit reels from largest place down so leading zeros are
  // suppressed naturally (a 6-digit target only mounts the digits it needs).
  const digits: number[] = []
  const places = [100000, 10000, 1000, 100, 10, 1]
  for (const p of places) if (end >= p) digits.push(p)

  return (
    <div
      ref={ref}
      style={{ fontSize, lineHeight: `${height}px` }}
      className={`inline-flex items-center overflow-hidden tabular-nums ${className ?? ''}`}
    >
      {prefix && <span>{prefix}</span>}
      {digits.map((place) => (
        <Digit key={place} place={place} value={value} height={height} />
      ))}
      {suffix && <span>{suffix}</span>}
    </div>
  )
}

function Digit({ place, value, height }: { place: number; value: number; height: number }) {
  const rounded = Math.floor(value / place)
  const spring = useSpring(rounded, { stiffness: 220, damping: 22 })
  useEffect(() => {
    spring.set(rounded)
  }, [spring, rounded])
  return (
    <div style={{ height }} className="relative w-[1ch]">
      {Array.from({ length: 10 }).map((_, i) => (
        <Number key={i} mv={spring} number={i} height={height} />
      ))}
    </div>
  )
}

function Number({
  mv,
  number,
  height,
}: {
  mv: MotionValue<number>
  number: number
  height: number
}) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10
    let offset = (10 + number - placeValue) % 10
    let memo = offset * height
    if (offset > 5) memo -= 10 * height
    return memo
  })
  return (
    <motion.span style={{ y }} className="absolute inset-0 flex items-center justify-center">
      {number}
    </motion.span>
  )
}
