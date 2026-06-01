// Velocity-scrubbing horizontal marquee. Adapted from 21st.dev's "Text Marque"
// pattern: the strip scrolls at `baseVelocity`, and when `scrollDependent` is
// on, scrolling speeds it up (and reverses direction) so the page feels alive
// without being noisy.
//
// Differences from the upstream snippet:
//  • Uses `framer-motion` (this project's installed version) instead of
//    `motion/react`.
//  • Inlines the `wrap` helper from `@motionone/utils` so we don't need to add
//    that dependency just to wrap a single number.
//  • Drops the `cn` util — we accept a plain `className` string.
//  • Accepts `children` as ReactNode (not just `string`) so the kicker can
//    include inline accent marks like "·" or "★".

import { useEffect, useRef, forwardRef, type ReactNode } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion'

// Inlined from @motionone/utils. Wraps v into [min, max), looping in both
// directions so the marquee can scroll past either edge.
function wrap(min: number, max: number, v: number): number {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

interface TextMarqueeProps {
  children: ReactNode
  baseVelocity?: number
  className?: string
  scrollDependent?: boolean
  delay?: number
  repeat?: number
}

const TextMarquee = forwardRef<HTMLDivElement, TextMarqueeProps>(function TextMarquee(
  { children, baseVelocity = -3, className, scrollDependent = true, delay = 0, repeat = 4 },
  ref,
) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 2], { clamp: false })

  // Translate baseX into a percentage offset, wrapping at -45%..-20% so the
  // repeated children form a seamless loop without ever exposing a gap.
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`)

  const directionFactor = useRef<number>(1)
  const hasStarted = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      hasStarted.current = true
    }, delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  useAnimationFrame((_t, deltaMs) => {
    if (!hasStarted.current) return
    let moveBy = directionFactor.current * baseVelocity * (deltaMs / 1000)
    if (scrollDependent) {
      const vf = velocityFactor.get()
      if (vf < 0) directionFactor.current = -1
      else if (vf > 0) directionFactor.current = 1
      moveBy += directionFactor.current * moveBy * vf
    }
    baseX.set(baseX.get() + moveBy)
  })

  // `repeat` copies of children — 4 is enough that the wrap range never shows
  // a visible seam at any viewport width.
  const copies = Array.from({ length: repeat })

  return (
    <div ref={ref} className="overflow-hidden whitespace-nowrap flex flex-nowrap">
      <motion.div className="flex whitespace-nowrap gap-10 flex-nowrap" style={{ x }}>
        {copies.map((_, i) => (
          <span key={i} className={`block ${className ?? ''}`}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  )
})

export default TextMarquee
