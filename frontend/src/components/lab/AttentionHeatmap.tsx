import { useMemo } from 'react'

export default function AttentionHeatmap({
  matrix,
  tokens,
  cellSize = 14,
}: {
  matrix: number[][]
  tokens: string[]
  cellSize?: number
}) {
  const max = useMemo(() => {
    let m = 0
    for (const row of matrix) for (const v of row) if (v > m) m = v
    return m || 1
  }, [matrix])

  const seqLen = matrix.length
  if (seqLen === 0) return null

  return (
    <div className="overflow-auto">
      <div
        className="relative"
        style={{
          paddingLeft: 88,
          paddingTop: 88,
        }}
      >
        {/* column labels (top) */}
        <div className="absolute left-[88px] top-0 flex" style={{ height: 88 }}>
          {tokens.map((t, i) => (
            <div
              key={`col-${i}`}
              className="flex items-end justify-center font-mono text-[9px] text-ink/55"
              style={{
                width: cellSize,
                height: 88,
              }}
            >
              <span
                className="origin-bottom-left translate-x-[6px] -rotate-90 whitespace-nowrap"
                style={{ transformOrigin: 'left bottom' }}
              >
                {t.length > 12 ? `${t.slice(0, 11)}…` : t}
              </span>
            </div>
          ))}
        </div>

        {/* row labels + cells */}
        {matrix.map((row, i) => (
          <div key={`row-${i}`} className="flex items-center">
            <div
              className="absolute left-0 font-mono text-[10px] text-ink/65 truncate text-right pr-2"
              style={{
                width: 80,
                height: cellSize,
                lineHeight: `${cellSize}px`,
                top: 88 + i * cellSize,
              }}
            >
              {tokens[i]?.length > 12 ? `${tokens[i].slice(0, 11)}…` : tokens[i]}
            </div>
            {row.map((v, j) => {
              const intensity = v / max // 0..1
              const bg = `rgba(17,17,17,${(intensity * 0.92).toFixed(3)})`
              return (
                <div
                  key={`cell-${i}-${j}`}
                  title={`q=${tokens[i] ?? i} k=${tokens[j] ?? j} · ${v.toFixed(4)}`}
                  className="border-r border-b border-ink/[0.06]"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: bg,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
