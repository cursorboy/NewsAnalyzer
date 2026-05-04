import { motion } from 'framer-motion'

const TOKENS = [
  'the',
  'reckless',
  'GOP',
  'plan',
  'slammed',
  'working',
  'families',
  'on',
  'Thursday',
]
const WEIGHTS = [0.1, 0.92, 0.84, 0.34, 0.88, 0.52, 0.61, 0.08, 0.18]

export default function AttentionRolloutFigure() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border border-ink/30 bg-paper p-5"
    >
      <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 8 · Attention rollout (Abnar &amp; Zuidema, 2020)
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TOKENS.map((t, i) => (
          <span
            key={i}
            className="px-2 py-1 text-[14px] text-ink font-serif"
            style={{
              backgroundColor: `rgba(185, 28, 28, ${WEIGHTS[i] * 0.7})`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 font-sans text-[10px] text-ink/55">
        <span>low</span>
        <div
          className="flex-1 h-2"
          style={{
            background: 'linear-gradient(to right, transparent, #B91C1C)',
          }}
        />
        <span>high</span>
      </div>
    </motion.div>
  )
}
