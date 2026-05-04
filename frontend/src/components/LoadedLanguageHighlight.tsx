import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  text: string
  reason: string
}

export default function LoadedLanguageHighlight({ text, reason }: Props) {
  const [hover, setHover] = useState(false)

  return (
    <span
      className="relative inline"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
    >
      <mark className="bg-accent/10 text-ink underline decoration-accent decoration-2 underline-offset-4 px-[1px] cursor-help">
        {text}
      </mark>
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 border border-ink/20 bg-paper px-3 py-2 font-sans text-[11px] leading-snug text-ink/80"
          >
            <span className="block text-[9px] uppercase tracking-[0.18em] text-ink/50 mb-1">
              Loaded language
            </span>
            {reason}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
