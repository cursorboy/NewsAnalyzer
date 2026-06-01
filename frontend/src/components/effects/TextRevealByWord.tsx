// Scroll-driven word reveal. Adapted from 21st.dev's TextRevealByWord (Magic
// UI pattern). Words start at 20% opacity and fade to full as the user scrolls
// through the section — gives the manifesto paragraph a slow, deliberate
// reading cadence.
//
// Adaptations:
//  • `cn` dropped — plain className concat
//  • Theme: ink color (not white/black), editorial serif font
//  • Container height + offset reduced so it doesn't require 200vh of scroll

import { useRef, type FC, type ReactNode } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

interface TextRevealByWordProps {
  text: string
  className?: string
  highlightLastN?: number
}

export const TextRevealByWord: FC<TextRevealByWordProps> = ({
  text,
  className,
  highlightLastN = 0,
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  // Reveal range: start as soon as the paragraph crosses the bottom of the
  // viewport (`start end`), finish well before it exits the top (`end 0.6`).
  // Previously the end anchor was tied to `start 0.1`, which only finished the
  // reveal once the paragraph's TOP was nearly at the viewport top — by then
  // the user had already scrolled past the section and the last third of the
  // sentence never reached full opacity.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end 0.6'],
  })
  const words = text.split(' ')

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <p className="flex flex-wrap font-serif text-[20px] leading-[1.7] text-ink/90 md:text-[22px]">
        {words.map((word, i) => {
          const start = i / words.length
          const end = start + 1 / words.length
          const isHighlight = highlightLastN > 0 && i >= words.length - highlightLastN
          return (
            <Word
              key={i}
              progress={scrollYProgress}
              range={[start, end]}
              highlight={isHighlight}
            >
              {word}
            </Word>
          )
        })}
      </p>
    </div>
  )
}

interface WordProps {
  children: ReactNode
  progress: MotionValue<number>
  range: [number, number]
  highlight: boolean
}

const Word: FC<WordProps> = ({ children, progress, range, highlight }) => {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span className="relative mx-1 lg:mx-1.5">
      <span className="absolute text-ink/15">{children}</span>
      <motion.span
        style={{ opacity }}
        className={highlight ? 'text-accent' : 'text-ink'}
      >
        {children}
      </motion.span>
    </span>
  )
}
