import { motion } from 'framer-motion'

const STAGES: [string, string, number][] = [
  ['Raw articles ingested', '14,820,400', 1.0],
  ['English political-news filter', '2,617,000', 0.55],
  ['Deduplication (SimHash)', '1,940,800', 0.42],
  ['Story clustering (SimCSE, ε=0.18)', '486,200', 0.3],
  ['Clusters spanning ≥3 outlets / different bias buckets', '142,900', 0.18],
  ['Cross-outlet article pairs', '1,240,600', 0.08],
]

export default function DatasetFunnel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border border-ink/30 bg-paper p-6"
    >
      <div className="mb-4 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 2 · Dataset funnel · Jan 2024 – Sep 2025
      </div>
      <div className="space-y-2.5 font-sans">
        {STAGES.map(([label, n, w], i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0.6 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
            style={{ transformOrigin: 'left center' }}
            className="flex items-center gap-4"
          >
            <span className="w-72 text-[12px] text-ink/75">{label}</span>
            <span className="flex-1 h-5 bg-ink/10 relative">
              <span
                className="absolute inset-y-0 left-0 bg-ink"
                style={{ width: `${w * 100}%` }}
              />
            </span>
            <span className="w-28 text-right text-[12px] tabular-nums text-ink/85">
              {n}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 font-serif text-[12px] italic leading-snug text-ink/65">
        Six-stage filter from 14.8M raw articles to the 1.24M cross-outlet
        article pairs that anchor the comparison-bias training signal.
      </div>
    </motion.div>
  )
}
