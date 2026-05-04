import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
  show: boolean
  points: number
  variant: 'correct' | 'wrong' | 'partial'
  onDone?: () => void
}

const COLORS = {
  correct: 'text-emerald-600',
  wrong: 'text-accent',
  partial: 'text-amber-500',
}

export default function PointBurst({ show, points, variant, onDone }: Props) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (show) {
      setVisible(true)
      const t = setTimeout(() => {
        setVisible(false)
        onDone?.()
      }, 950)
      return () => clearTimeout(t)
    }
  }, [show, onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            initial={{ scale: 0.3, y: 30, opacity: 0 }}
            animate={{ scale: [0.3, 1.25, 1], y: [30, -8, -28], opacity: [0, 1, 0] }}
            transition={{
              duration: 0.95,
              times: [0, 0.35, 1],
              ease: ['easeOut', 'easeIn'],
            }}
            className={`font-serif font-bold leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.18)] text-[200px] md:text-[260px] tabular-nums ${COLORS[variant]}`}
          >
            {points >= 0 ? `+${points}` : points}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
