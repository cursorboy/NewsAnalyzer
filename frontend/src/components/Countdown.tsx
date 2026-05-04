import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sfx } from '../lib/gameSound'

type Props = {
  onDone: () => void
}

const SEQUENCE = ['3', '2', '1', 'GO!'] as const

export default function Countdown({ onDone }: Props) {
  const [idx, setIdx] = useState(0)
  const cur = SEQUENCE[idx]

  useEffect(() => {
    sfx.unlock()
    if (idx < SEQUENCE.length - 1) {
      sfx.tick()
    } else {
      sfx.go()
    }
    const t = setTimeout(() => {
      if (idx < SEQUENCE.length - 1) {
        setIdx(idx + 1)
      } else {
        onDone()
      }
    }, idx === SEQUENCE.length - 1 ? 600 : 700)
    return () => clearTimeout(t)
  }, [idx, onDone])

  return (
    <button
      type="button"
      onClick={onDone}
      className="fixed inset-0 z-40 flex items-center justify-center bg-paper cursor-pointer"
      aria-label="Skip countdown"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={cur}
          initial={{ scale: 0.4, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.6, opacity: 0, y: -20 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 22,
            duration: 0.45,
          }}
          className={`font-serif font-semibold leading-none ${
            cur === 'GO!' ? 'text-accent text-[180px] md:text-[260px]' : 'text-ink text-[180px] md:text-[260px]'
          }`}
        >
          {cur}
        </motion.span>
      </AnimatePresence>
      <span className="absolute bottom-8 right-8 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/40">
        Tap to skip
      </span>
    </button>
  )
}
