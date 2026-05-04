/* Shared bits used by all three directions */

const Fleuron = ({ size = 14, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={`shrink-0 fill-current ${className}`} aria-hidden="true">
    <path d="M12 2 L13.2 8.6 L19.8 9.8 L13.2 11 L12 17.6 L10.8 11 L4.2 9.8 L10.8 8.6 Z" />
    <circle cx="12" cy="20.5" r="0.9" />
  </svg>
);

const ThinDiamond = ({ size = 9, className = "" }) => (
  <svg viewBox="0 0 14 14" width={size} height={size} className={`shrink-0 fill-current ${className}`} aria-hidden="true">
    <path d="M7 0 L14 7 L7 14 L0 7 Z" />
  </svg>
);

/* Tiny SVG sparkline / radar / bar / heatmap helpers */
const MiniRadar = ({ values, size = 140, color = "#B91C1C" }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const n = values.length;
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = r * Math.max(0.05, Math.min(1, v));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const grid = [0.33, 0.66, 1].map((g) =>
    Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + Math.cos(a) * r * g, cy + Math.sin(a) * r * g];
    })
  );
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden="true">
      {grid.map((ring, gi) => (
        <polygon key={gi} points={ring.map((p) => p.join(",")).join(" ")} fill="none" stroke="#11111122" strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="#11111118" strokeWidth="1" />;
      })}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1.4" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />
      ))}
    </svg>
  );
};

const SpectrumBar = ({ score = 0.18, marker = true, height = 8 }) => {
  // score in [-1, 1]
  const left = ((score + 1) / 2) * 100;
  return (
    <div className="relative w-full" style={{ height }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(to right, #1d4ed8 0%, #60a5fa 25%, #d7d2c4 50%, #ef4444 75%, #b91c1c 100%)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-[14px] w-px -translate-x-1/2 -translate-y-1/2 bg-ink/40" />
      {marker && (
        <div
          className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-ink bg-paper-cream"
          style={{ left: `${left}%` }}
        />
      )}
    </div>
  );
};

const ArchitectureDiagram = ({ small = false }) => {
  // simple SVG: encoder block -> 8 heads
  const w = small ? 320 : 460;
  const h = small ? 130 : 170;
  const heads = ["FACT", "ECON", "SOC", "EST", "SENS", "LOAD", "DIV", "H/B"];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" aria-hidden="true">
      {/* Input token strip */}
      <g>
        <rect x="6" y={h / 2 - 14} width="64" height="28" fill="none" stroke="#111" strokeWidth="1.2" />
        <text x="38" y={h / 2 + 4} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, Menlo, monospace" fill="#111">tokens</text>
      </g>
      {/* arrow */}
      <line x1="70" y1={h / 2} x2="120" y2={h / 2} stroke="#111" strokeWidth="1.2" />
      <polygon points={`120,${h / 2 - 4} 128,${h / 2} 120,${h / 2 + 4}`} fill="#111" />
      {/* Encoder */}
      <g>
        <rect x="128" y={h / 2 - 30} width="120" height="60" fill="#111" />
        <text x="188" y={h / 2 - 6} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, Menlo, monospace" fill="#F4EDDF" letterSpacing="2">ENCODER</text>
        <text x="188" y={h / 2 + 10} textAnchor="middle" fontSize="9" fontFamily="ui-monospace, Menlo, monospace" fill="#F4EDDF" opacity="0.7">12 layer · 768d</text>
      </g>
      {/* Fan-out lines + 8 heads */}
      {heads.map((label, i) => {
        const yStart = h / 2;
        const yEnd = 14 + ((h - 28) / 7) * i;
        const xEnd = w - 64;
        return (
          <g key={label}>
            <line x1="248" y1={yStart} x2={xEnd} y2={yEnd} stroke="#111" strokeOpacity="0.45" strokeWidth="1" />
            <rect x={xEnd} y={yEnd - 9} width="58" height="18" fill="none" stroke="#B91C1C" strokeWidth="1.1" />
            <text x={xEnd + 29} y={yEnd + 4} textAnchor="middle" fontSize="9" fontFamily="Inter, ui-sans-serif, system-ui" letterSpacing="1.5" fill="#B91C1C">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* Common dateline bar */
const DatelineBar = () => (
  <div className="border-t-[3px] border-ink">
    <div className="border-b border-ink/30">
      <div className="flex items-center justify-between gap-4 px-8 py-2 text-[10px] uppercase tracking-[0.22em] text-ink/70" style={{ fontFamily: "Inter" }}>
        <span>Vol. II</span>
        <span className="text-ink/30">·</span>
        <span>No. v2.0.0</span>
        <span className="text-ink/30">·</span>
        <span className="italic normal-case tracking-normal text-[12px] text-ink/75" style={{ fontFamily: '"Source Serif 4", serif' }}>
          Tuesday, May 4, 2026
        </span>
        <span className="text-ink/30">·</span>
        <span>Late Edition</span>
        <span className="text-ink/30">·</span>
        <span>$4.00</span>
      </div>
    </div>
  </div>
);

Object.assign(window, { Fleuron, ThinDiamond, MiniRadar, SpectrumBar, ArchitectureDiagram, DatelineBar });
