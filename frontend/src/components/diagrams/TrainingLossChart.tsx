import { motion } from 'framer-motion'
import { useMemo } from 'react'

const W = 680
const H = 220
const PAD = { l: 44, r: 16, t: 14, b: 28 }

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function TrainingLossChart() {
  const xs = (i: number) => PAD.l + (i / 100) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b)

  const { v1Path, v2Path, v2End } = useMemo(() => {
    const rand = mulberry32(42)
    const v2 = Array.from({ length: 101 }, (_, i) => {
      const t = i / 100
      return 0.78 * Math.exp(-3.4 * t) + 0.18 + (rand() - 0.5) * 0.012
    })
    const v1 = Array.from({ length: 101 }, (_, i) => {
      const t = i / 100
      if (t < 0.42)
        return 0.78 * Math.exp(-3.6 * t) + 0.18 + (rand() - 0.5) * 0.015
      return 0.3 + (t - 0.42) * 0.95 + (rand() - 0.5) * 0.02
    })
    const path = (arr: number[]) =>
      arr
        .map(
          (v, i) =>
            `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`
        )
        .join(' ')
    return { v1Path: path(v1), v2Path: path(v2), v2End: v2[96] }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border border-ink/30 bg-paper p-5"
    >
      <div className="mb-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 6 · Training loss · v1 (failed, β=0.30) vs v2 (β=0.05)
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="font-mono"
      >
        {/* axes */}
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          stroke="#111"
          strokeWidth={1}
        />
        <line
          x1={PAD.l}
          y1={PAD.t}
          x2={PAD.l}
          y2={H - PAD.b}
          stroke="#111"
          strokeWidth={1}
        />
        {/* y ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1={PAD.l - 4}
              y1={ys(t)}
              x2={PAD.l}
              y2={ys(t)}
              stroke="#111"
            />
            <text
              x={PAD.l - 8}
              y={ys(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#111"
              opacity={0.6}
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {/* x labels (epochs) */}
        {[0, 1, 2, 3, 4].map((e) => (
          <text
            key={e}
            x={xs(e * 25)}
            y={H - PAD.b + 14}
            textAnchor="middle"
            fontSize={9}
            fill="#111"
            opacity={0.6}
          >
            {e}
          </text>
        ))}
        <text
          x={W / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#111"
          opacity={0.55}
        >
          epoch
        </text>

        {/* v1 (red, dashed) */}
        <motion.path
          d={v1Path}
          fill="none"
          stroke="#B91C1C"
          strokeWidth={1.4}
          strokeDasharray="4 3"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* v2 (ink, solid) */}
        <motion.path
          d={v2Path}
          fill="none"
          stroke="#111"
          strokeWidth={1.6}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* annotation: v1 collapse marker */}
        <line
          x1={xs(42)}
          y1={PAD.t + 4}
          x2={xs(42)}
          y2={H - PAD.b}
          stroke="#B91C1C"
          strokeDasharray="2 3"
          strokeOpacity={0.5}
        />
        <text
          x={xs(42) + 6}
          y={PAD.t + 14}
          fontSize={9}
          fill="#B91C1C"
          fontFamily="Inter, sans-serif"
        >
          v1 collapse (adv. weight too high)
        </text>
        <text
          x={xs(96)}
          y={ys(v2End) - 8}
          textAnchor="end"
          fontSize={10}
          fill="#111"
          fontFamily="Inter, sans-serif"
        >
          v2 · final 0.211
        </text>
      </svg>
      <div className="mt-3 font-serif italic text-[12px] leading-snug text-ink/65">
        v1 collapsed at epoch 1.7 when β=0.30 made the adversary too strong.
        v2 dropped β to 0.05 and trained cleanly to 0.211.
      </div>
    </motion.div>
  )
}
