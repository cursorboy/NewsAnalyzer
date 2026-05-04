import { motion } from 'framer-motion'

const HEADS: [string, string][] = [
  ['FACT', 'Factuality'],
  ['ECON', 'Economic frame'],
  ['SOC', 'Social frame'],
  ['EST', 'Establishment'],
  ['SENS', 'Sensationalism'],
  ['LOAD', 'Loaded language'],
  ['DIV', 'Source diversity'],
  ['HB', 'Headline / body'],
]

export default function ArchitectureFigure() {
  const w = 720
  const h = 360

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="border border-ink/30 bg-paper p-5"
    >
      <div className="mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        Figure 1 · Architecture
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="auto"
        className="font-mono"
        aria-label="Architecture diagram: tokens flow into a shared DeBERTa-v3 encoder, fanning out to eight task heads with a dashed adversarial outlet branch"
      >
        {/* Tokens box */}
        <g>
          <rect
            x={20}
            y={h / 2 - 20}
            width={80}
            height={40}
            fill="none"
            stroke="#111"
            strokeWidth={1.2}
          />
          <text
            x={60}
            y={h / 2 + 4}
            textAnchor="middle"
            fontSize={11}
            fill="#111"
          >
            tokens
          </text>
          <text
            x={60}
            y={h / 2 + 34}
            textAnchor="middle"
            fontSize={9}
            fill="#111"
            opacity={0.55}
          >
            [CLS] x₁ x₂ … [SEP]
          </text>
        </g>

        {/* Arrow tokens -> encoder */}
        <line x1={100} y1={h / 2} x2={160} y2={h / 2} stroke="#111" strokeWidth={1.2} />
        <polygon
          points={`160,${h / 2 - 4} 168,${h / 2} 160,${h / 2 + 4}`}
          fill="#111"
        />

        {/* Encoder block */}
        <g>
          <rect x={168} y={h / 2 - 50} width={180} height={100} fill="#111" />
          <text
            x={258}
            y={h / 2 - 22}
            textAnchor="middle"
            fontSize={13}
            fill="#F4EDDF"
            letterSpacing={3}
          >
            DeBERTa-v3
          </text>
          <text
            x={258}
            y={h / 2 - 4}
            textAnchor="middle"
            fontSize={10}
            fill="#F4EDDF"
            opacity={0.7}
          >
            12 layer · 12 head · 768d
          </text>
          <text
            x={258}
            y={h / 2 + 14}
            textAnchor="middle"
            fontSize={10}
            fill="#F4EDDF"
            opacity={0.7}
          >
            139M params · shared
          </text>
          <text
            x={258}
            y={h / 2 + 34}
            textAnchor="middle"
            fontSize={9}
            fill="#F4EDDF"
            opacity={0.5}
          >
            [CLS] pooled output
          </text>
        </g>

        {/* 8 head fan-out */}
        {HEADS.map(([code, name], i) => {
          const yEnd = 22 + ((h - 44) / 7) * i
          const xEnd = w - 200
          return (
            <g key={code}>
              <line
                x1={348}
                y1={h / 2}
                x2={xEnd}
                y2={yEnd}
                stroke="#111"
                strokeOpacity={0.45}
                strokeWidth={1}
              />
              <rect
                x={xEnd}
                y={yEnd - 12}
                width={180}
                height={24}
                fill="none"
                stroke="#B91C1C"
                strokeWidth={1.1}
              />
              <text
                x={xEnd + 10}
                y={yEnd + 4}
                fontSize={10}
                fill="#B91C1C"
                letterSpacing={2}
              >
                {code}
              </text>
              <text
                x={xEnd + 56}
                y={yEnd + 4}
                fontSize={10}
                fill="#111"
                fontFamily='"Source Serif 4", Georgia, serif'
              >
                {name}
              </text>
              <text
                x={xEnd + 174}
                y={yEnd + 4}
                fontSize={9}
                textAnchor="end"
                fill="#111"
                opacity={0.5}
              >
                2-layer MLP
              </text>
            </g>
          )
        })}

        {/* Adversarial branch */}
        <g>
          <line
            x1={258}
            y1={h / 2 + 50}
            x2={258}
            y2={h - 30}
            stroke="#111"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <rect
            x={180}
            y={h - 30}
            width={156}
            height={22}
            fill="none"
            stroke="#111"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <text
            x={258}
            y={h - 14}
            textAnchor="middle"
            fontSize={10}
            fill="#111"
            opacity={0.7}
          >
            adversarial outlet head (gradient-reversed)
          </text>
        </g>
      </svg>
      <div className="mt-3 font-serif text-[12px] italic leading-snug text-ink/65">
        Tokens enter a shared DeBERTa-v3 encoder. The pooled [CLS] vector fans out
        to eight task heads. A dashed adversarial outlet classifier with a
        gradient-reversal layer is trained against the encoder so outlet identity
        does not enter the shared representation.
      </div>
    </motion.div>
  )
}
