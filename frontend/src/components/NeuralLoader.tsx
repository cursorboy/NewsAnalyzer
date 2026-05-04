import { motion } from 'framer-motion'

type Props = {
  label?: string
  className?: string
}

const LAYERS = [4, 6, 4]
const WIDTH = 280
const HEIGHT = 160
const PAD_X = 24
const PAD_Y = 16

function nodePositions(): { x: number; y: number; layer: number; idx: number }[] {
  const innerW = WIDTH - PAD_X * 2
  const innerH = HEIGHT - PAD_Y * 2
  const nodes: { x: number; y: number; layer: number; idx: number }[] = []
  LAYERS.forEach((count, layer) => {
    const x = PAD_X + (innerW * layer) / (LAYERS.length - 1)
    for (let i = 0; i < count; i += 1) {
      const y =
        count === 1
          ? PAD_Y + innerH / 2
          : PAD_Y + (innerH * i) / (count - 1)
      nodes.push({ x, y, layer, idx: i })
    }
  })
  return nodes
}

export default function NeuralLoader({ label, className }: Props) {
  const nodes = nodePositions()
  const edges: { from: { x: number; y: number }; to: { x: number; y: number }; layer: number }[] = []
  for (let l = 0; l < LAYERS.length - 1; l += 1) {
    const from = nodes.filter((n) => n.layer === l)
    const to = nodes.filter((n) => n.layer === l + 1)
    from.forEach((a) => {
      to.forEach((b) => {
        edges.push({ from: { x: a.x, y: a.y }, to: { x: b.x, y: b.y }, layer: l })
      })
    })
  }

  const cycle = 1.8

  return (
    <div className={`flex flex-col items-center gap-4 font-sans ${className ?? ''}`}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Neural network inference"
      >
        {edges.map((e, i) => {
          const delay = e.layer * (cycle / LAYERS.length) + (i % 6) * 0.04
          return (
            <motion.line
              key={`e-${i}`}
              x1={e.from.x}
              y1={e.from.y}
              x2={e.to.x}
              y2={e.to.y}
              stroke="#111111"
              strokeOpacity={0.18}
              strokeWidth={0.6}
              initial={{ pathLength: 0, opacity: 0.05 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0.05, 0.55, 0.12] }}
              transition={{
                duration: cycle,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
              }}
            />
          )
        })}
        {nodes.map((n, i) => {
          const delay = n.layer * (cycle / LAYERS.length) + n.idx * 0.05
          return (
            <g key={`n-${i}`}>
              <circle cx={n.x} cy={n.y} r={5.5} fill="#FAFAF7" stroke="#111111" strokeOpacity={0.35} strokeWidth={0.8} />
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={5.5}
                fill="#B91C1C"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                transition={{
                  duration: cycle,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay,
                }}
              />
            </g>
          )
        })}
      </svg>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55">
          TheBiasGraph v2 inference
        </span>
        {label && <span className="font-serif text-sm italic text-ink/75">{label}</span>}
      </div>
    </div>
  )
}
