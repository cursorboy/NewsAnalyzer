import { motion } from 'framer-motion'

const ROWS: [string, number, number, number][] = [
  ['Factuality', 0.91, 0.094, 0.96],
  ['Economic frame', 0.84, 0.118, 0.89],
  ['Social frame', 0.81, 0.126, 0.88],
  ['Establishment', 0.86, 0.108, 0.92],
  ['Sensationalism', 0.79, 0.131, 0.85],
  ['Loaded language', 0.88, 0.099, 0.94],
  ['Source diversity', 0.74, 0.142, 0.81],
  ['Headline / body', 0.82, 0.121, 0.87],
]

export default function EvalTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border border-ink/30 bg-paper p-5"
    >
      <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 7 · Held-out evaluation · n = 12,000
      </div>
      <table className="w-full text-[12px] font-mono">
        <thead className="text-ink/55">
          <tr className="border-b border-ink/30">
            <th className="text-left py-1.5 pr-4 font-sans">Dimension</th>
            <th className="text-right py-1.5 px-3 font-sans">F1</th>
            <th className="text-right py-1.5 px-3 font-sans">RMSE</th>
            <th className="text-right py-1.5 px-3 font-sans">Human ceiling</th>
          </tr>
        </thead>
        <tbody className="text-ink/85">
          {ROWS.map(([k, f, r, h], i) => (
            <motion.tr
              key={k}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
              className="border-b border-ink/10"
            >
              <td className="py-1.5 pr-4 font-serif">{k}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">
                {f.toFixed(2)}
              </td>
              <td className="text-right py-1.5 px-3 tabular-nums text-ink/55">
                {r.toFixed(3)}
              </td>
              <td className="text-right py-1.5 px-3 tabular-nums text-ink/55">
                {h.toFixed(2)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 font-sans text-[11px] text-ink/55">
        Headline: <span className="text-ink">94.1%</span> bias-direction
        concordance with AllSides.
      </div>
    </motion.div>
  )
}
