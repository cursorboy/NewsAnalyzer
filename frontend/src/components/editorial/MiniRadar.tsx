export default function MiniRadar({
  values,
  size = 140,
  color = '#B91C1C',
}: {
  values: number[]
  size?: number
  color?: string
}) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 14
  const n = values.length
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    const rr = r * Math.max(0.05, Math.min(1, v))
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const
  })
  const grid = [0.33, 0.66, 1].map((g) =>
    Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2
      return [cx + Math.cos(a) * r * g, cy + Math.sin(a) * r * g] as const
    })
  )
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden>
      {grid.map((ring, gi) => (
        <polygon
          key={gi}
          points={ring.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="#11111122"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="#11111118"
            strokeWidth="1"
          />
        )
      })}
      <polygon
        points={pts.map((p) => p.join(',')).join(' ')}
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth="1.4"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />
      ))}
    </svg>
  )
}
