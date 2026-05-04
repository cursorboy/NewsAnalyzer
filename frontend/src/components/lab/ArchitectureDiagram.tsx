const HEADS = ['FACT', 'ECON', 'SOC', 'EST', 'SENS', 'LOAD', 'DIV', 'H/B']

export default function ArchitectureDiagram() {
  const w = 760
  const h = 360

  const tokensX = 28
  const tokensY = h / 2 - 18
  const tokensW = 110
  const tokensH = 36

  const encX = 240
  const encY = h / 2 - 44
  const encW = 220
  const encH = 88

  const headW = 70
  const headH = 32
  const headsX = w - headW - 24
  const headsTop = 22
  const headsGap = (h - headsTop * 2 - headHeight()) / (HEADS.length - 1)

  function headHeight() {
    return headH
  }

  return (
    <figure className="my-10 border border-ink/30 bg-paper">
      <div className="border-b border-ink/30 px-4 py-2 flex items-baseline justify-between">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/65">
          Figure 1 · Architecture
        </span>
        <span className="font-serif text-[11px] italic text-ink/55">
          Eight independent heads, one shared encoder.
        </span>
      </div>
      <div className="overflow-x-auto p-5">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          style={{ minWidth: 720 }}
          className="text-ink"
          aria-label="Architecture diagram: tokens flow into a shared DeBERTa-v3 encoder, fanning out to eight task heads with a dashed adversarial outlet branch"
        >
          {/* Tokens box */}
          <g>
            <rect
              x={tokensX}
              y={tokensY}
              width={tokensW}
              height={tokensH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <text
              x={tokensX + tokensW / 2}
              y={tokensY + tokensH / 2 + 4}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="11"
              fill="currentColor"
            >
              tokens
            </text>
            <text
              x={tokensX}
              y={tokensY - 8}
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="1.5"
              fill="currentColor"
              opacity="0.55"
            >
              INPUT
            </text>
          </g>

          {/* Arrow tokens -> encoder */}
          <line
            x1={tokensX + tokensW}
            y1={h / 2}
            x2={encX - 10}
            y2={h / 2}
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <polygon
            points={`${encX - 10},${h / 2 - 5} ${encX},${h / 2} ${encX - 10},${h / 2 + 5}`}
            fill="currentColor"
          />

          {/* Solid black ENCODER */}
          <g>
            <rect x={encX} y={encY} width={encW} height={encH} fill="#111111" />
            <text
              x={encX + encW / 2}
              y={encY + 24}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="12"
              letterSpacing="3"
              fill="#F4EDDF"
              fontWeight="600"
            >
              ENCODER
            </text>
            <text
              x={encX + encW / 2}
              y={encY + 46}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="10"
              fill="#F4EDDF"
              opacity="0.85"
            >
              DeBERTa-v3
            </text>
            <text
              x={encX + encW / 2}
              y={encY + 62}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="9.5"
              fill="#F4EDDF"
              opacity="0.7"
            >
              12 layer · 12 head · 768d
            </text>
            <text
              x={encX + encW / 2}
              y={encY + 78}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="9.5"
              fill="#F4EDDF"
              opacity="0.7"
            >
              139M params
            </text>
            <text
              x={encX}
              y={encY - 8}
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="1.5"
              fill="currentColor"
              opacity="0.55"
            >
              SHARED · [CLS] POOLED
            </text>
          </g>

          {/* Fan-out lines + 8 outlined head boxes */}
          {HEADS.map((label, i) => {
            const yMid = headsTop + i * headsGap + headH / 2
            return (
              <g key={label}>
                <line
                  x1={encX + encW}
                  y1={h / 2}
                  x2={headsX}
                  y2={yMid}
                  stroke="currentColor"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />
                <rect
                  x={headsX}
                  y={yMid - headH / 2}
                  width={headW}
                  height={headH}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                />
                <text
                  x={headsX + headW / 2}
                  y={yMid + 4}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="10"
                  letterSpacing="1.5"
                  fill="currentColor"
                  fontWeight="500"
                >
                  {label}
                </text>
              </g>
            )
          })}
          <text
            x={headsX + headW / 2}
            y={headsTop - 8}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="1.5"
            fill="currentColor"
            opacity="0.55"
          >
            HEADS
          </text>

          {/* Dashed adversarial outlet branch, beneath the encoder */}
          <g>
            <line
              x1={encX + encW / 2}
              y1={encY + encH}
              x2={encX + encW / 2}
              y2={h - 36}
              stroke="currentColor"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <line
              x1={encX + encW / 2}
              y1={h - 36}
              x2={encX + encW + 60}
              y2={h - 36}
              stroke="currentColor"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <rect
              x={encX + encW + 60}
              y={h - 52}
              width={120}
              height={32}
              fill="none"
              stroke="currentColor"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={encX + encW + 120}
              y={h - 36}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="9"
              letterSpacing="1.5"
              fill="currentColor"
              opacity="0.7"
            >
              ADV · OUTLET
            </text>
            <text
              x={encX + encW + 120}
              y={h - 24}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="9"
              fill="currentColor"
              opacity="0.55"
            >
              GRL · λ=0.05
            </text>
          </g>
        </svg>
      </div>
      <figcaption className="border-t border-ink/30 px-4 py-2 font-serif text-[12px] italic leading-snug text-ink/65">
        Tokens enter a shared DeBERTa-v3 encoder. The pooled [CLS] vector fans out
        to eight task heads. A small adversarial outlet classifier with a
        gradient-reversal layer (dashed) is trained against the encoder so outlet
        identity is not encoded in the shared representation.
      </figcaption>
    </figure>
  )
}
