import { motion } from 'framer-motion'

export default function LossEquation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border-2 border-ink p-6 bg-paper text-ink font-mono"
    >
      <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 5 · Comparison-bias training objective
      </div>
      <div className="text-[20px] leading-[1.7]">
        <div>
          ℒ <span className="text-ink/40">=</span>{' '}
          ℒ<sub>sup</sub>{' '}
          <span className="text-ink/40">+</span>{' '}
          α · ℒ<sub>cmp</sub>{' '}
          <span className="text-ink/40">+</span>{' '}
          β · ℒ<sub>inv</sub>
        </div>
        <div className="mt-4 text-[13px] text-ink/65">
          <div>
            ℒ<sub>sup</sub> &nbsp;= &nbsp;Σ<sub>k=1..8</sub> &nbsp;BCE(ŷ
            <sub>k</sub>, y<sub>k</sub>)
          </div>
          <div className="mt-1">
            ℒ<sub>cmp</sub> &nbsp;= &nbsp;Σ<sub>(i,j) ∈ pairs</sub> &nbsp;max(0,
            m − ‖ŷ<sub>i</sub> − ŷ<sub>j</sub>‖₁)
          </div>
          <div className="mt-1">
            ℒ<sub>inv</sub> &nbsp;= &nbsp;− H(p<sub>outlet</sub>) &nbsp;
            <span className="opacity-60">
              (adversarial, gradient-reversed)
            </span>
          </div>
        </div>
        <div className="mt-5 font-sans text-[11px] text-ink/50">
          α = 0.40 · β = 0.05 · margin m = 0.15
        </div>
      </div>
      <div className="mt-5 font-serif italic text-[12px] leading-snug text-ink/65">
        Three-term loss: a supervised eight-head term, a within-cluster
        comparison term that pushes paired articles apart on the documented
        spread, and an adversarial outlet-invariance term that keeps the
        encoder from memorizing mastheads.
      </div>
    </motion.div>
  )
}
