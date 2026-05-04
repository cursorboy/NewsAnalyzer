/* Diagrams for /how-i-built-this — all hand-drawn SVG, no fluff. */

/* § IV — Architecture: shared encoder → 8 heads + adversarial outlet branch */
function ArchitectureFigure() {
  const w = 720, h = 360;
  const heads = [
    ['FACT',  'Factuality'],
    ['ECON',  'Economic frame'],
    ['SOC',   'Social frame'],
    ['EST',   'Establishment'],
    ['SENS',  'Sensationalism'],
    ['LOAD',  'Loaded language'],
    ['DIV',   'Source diversity'],
    ['HB',    'Headline / body'],
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
      {/* Tokens */}
      <g>
        <rect x="20" y={h/2 - 20} width="80" height="40" fill="none" stroke="#111" strokeWidth="1.2"/>
        <text x="60" y={h/2 + 4} textAnchor="middle" fontSize="11" fill="#111">tokens</text>
        <text x="60" y={h/2 + 34} textAnchor="middle" fontSize="9" fill="#111" opacity="0.55">[CLS] x₁ x₂ … [SEP]</text>
      </g>
      <line x1="100" y1={h/2} x2="160" y2={h/2} stroke="#111" strokeWidth="1.2"/>
      <polygon points={`160,${h/2 - 4} 168,${h/2} 160,${h/2 + 4}`} fill="#111"/>

      {/* Encoder */}
      <g>
        <rect x="168" y={h/2 - 50} width="180" height="100" fill="#111"/>
        <text x="258" y={h/2 - 22} textAnchor="middle" fontSize="13" fill="#F4EDDF" letterSpacing="3">DeBERTa-v3</text>
        <text x="258" y={h/2 - 4} textAnchor="middle" fontSize="10" fill="#F4EDDF" opacity="0.7">12 layer · 12 head · 768d</text>
        <text x="258" y={h/2 + 14} textAnchor="middle" fontSize="10" fill="#F4EDDF" opacity="0.7">139M params · shared</text>
        <text x="258" y={h/2 + 34} textAnchor="middle" fontSize="9" fill="#F4EDDF" opacity="0.5">[CLS] pooled output</text>
      </g>

      {/* 8 head fan-out */}
      {heads.map(([code, name], i) => {
        const yEnd = 22 + ((h - 44) / 7) * i;
        const xEnd = w - 200;
        return (
          <g key={code}>
            <line x1="348" y1={h/2} x2={xEnd} y2={yEnd} stroke="#111" strokeOpacity="0.45" strokeWidth="1"/>
            <rect x={xEnd} y={yEnd - 12} width="180" height="24" fill="none" stroke="#B91C1C" strokeWidth="1.1"/>
            <text x={xEnd + 10} y={yEnd + 4} fontSize="10" fill="#B91C1C" letterSpacing="2">{code}</text>
            <text x={xEnd + 56} y={yEnd + 4} fontSize="10" fill="#111" fontFamily='"Source Serif 4", Georgia, serif'>{name}</text>
            <text x={xEnd + 174} y={yEnd + 4} fontSize="9" textAnchor="end" fill="#111" opacity="0.5">2-layer MLP</text>
          </g>
        );
      })}

      {/* Adversarial branch */}
      <g>
        <line x1="258" y1={h/2 + 50} x2="258" y2={h - 30} stroke="#111" strokeDasharray="3 3" strokeWidth="1"/>
        <rect x="180" y={h - 30} width="156" height="22" fill="none" stroke="#111" strokeDasharray="3 3" strokeWidth="1"/>
        <text x="258" y={h - 14} textAnchor="middle" fontSize="10" fill="#111" opacity="0.7">adversarial outlet head (gradient-reversed)</text>
      </g>
    </svg>
  );
}

/* § V — Loss equation as a typeset block */
function LossEquation() {
  return (
    <div className="border-2 border-ink p-6 bg-paper text-ink" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3" style={{ fontFamily: 'Inter' }}>Figure 5 · Comparison-bias training objective</div>
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
          <div>ℒ<sub>sup</sub> &nbsp;= &nbsp;Σ<sub>k=1..8</sub> &nbsp;BCE(ŷ<sub>k</sub>, y<sub>k</sub>)</div>
          <div className="mt-1">ℒ<sub>cmp</sub> &nbsp;= &nbsp;Σ<sub>(i,j) ∈ pairs</sub> &nbsp;max(0, m − ‖ŷ<sub>i</sub> − ŷ<sub>j</sub>‖₁)</div>
          <div className="mt-1">ℒ<sub>inv</sub> &nbsp;= &nbsp;− H(p<sub>outlet</sub>) &nbsp; <span className="opacity-60">(adversarial, gradient-reversed)</span></div>
        </div>
        <div className="mt-5 text-[11px] text-ink/50" style={{ fontFamily: 'Inter' }}>α = 0.40 · β = 0.05 · margin m = 0.15</div>
      </div>
    </div>
  );
}

/* § II — Dataset funnel */
function DatasetFunnel() {
  const stages = [
    ['Raw articles ingested',  '14,820,400', 1.00],
    ['English political-news filter', '2,617,000', 0.55],
    ['Deduplication (SimHash)', '1,940,800', 0.42],
    ['Story clustering (SimCSE, ε=0.18)', '486,200', 0.30],
    ['Clusters spanning ≥3 outlets / different bias buckets', '142,900', 0.18],
    ['Cross-outlet article pairs', '1,240,600', 0.08],
  ];
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4" style={{ fontFamily: 'Inter' }}>Figure 2 · Dataset funnel · Jan 2024 – Sep 2025</div>
      <div className="space-y-2.5" style={{ fontFamily: 'Inter' }}>
        {stages.map(([label, n, w], i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-72 text-[12px] text-ink/75">{label}</span>
            <span className="flex-1 h-5 bg-ink/8 relative">
              <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${w * 100}%` }} />
            </span>
            <span className="w-28 text-right text-[12px] tabular-nums text-ink/85">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* § VI — Training loss curve, with v1 collapse + v2 success */
function TrainingLossChart() {
  const W = 680, H = 220;
  const pad = { l: 44, r: 16, t: 14, b: 28 };
  const xs = (i) => pad.l + (i / 100) * (W - pad.l - pad.r);
  const ys = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  // v2 (success): nice descending curve
  const v2 = Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    return 0.78 * Math.exp(-3.4 * t) + 0.18 + (Math.random() - 0.5) * 0.012;
  });
  // v1 (failed): descends then collapses upward
  const v1 = Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    if (t < 0.42) return 0.78 * Math.exp(-3.6 * t) + 0.18 + (Math.random() - 0.5) * 0.015;
    return 0.30 + (t - 0.42) * 0.95 + (Math.random() - 0.5) * 0.02;
  });
  const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
  return (
    <div className="border border-ink/30 bg-paper p-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2" style={{ fontFamily: 'Inter' }}>Figure 6 · Training loss · v1 (failed, β=0.30) vs v2 (β=0.05)</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {/* axes */}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#111" strokeWidth="1"/>
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#111" strokeWidth="1"/>
        {/* y ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={pad.l - 4} y1={ys(t)} x2={pad.l} y2={ys(t)} stroke="#111"/>
            <text x={pad.l - 8} y={ys(t) + 3} textAnchor="end" fontSize="9" fill="#111" opacity="0.6">{t.toFixed(2)}</text>
          </g>
        ))}
        {/* x labels (epochs) */}
        {[0, 1, 2, 3, 4].map((e) => (
          <text key={e} x={xs(e * 25)} y={H - pad.b + 14} textAnchor="middle" fontSize="9" fill="#111" opacity="0.6">{e}</text>
        ))}
        <text x={(W) / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#111" opacity="0.55">epoch</text>

        {/* v1 (red, dashed) */}
        <path d={path(v1)} fill="none" stroke="#B91C1C" strokeWidth="1.4" strokeDasharray="4 3" />
        {/* v2 (ink, solid) */}
        <path d={path(v2)} fill="none" stroke="#111" strokeWidth="1.6" />
        {/* annotations */}
        <line x1={xs(42)} y1={pad.t + 4} x2={xs(42)} y2={H - pad.b} stroke="#B91C1C" strokeDasharray="2 3" strokeOpacity="0.5"/>
        <text x={xs(42) + 6} y={pad.t + 14} fontSize="9" fill="#B91C1C">v1 collapse (adv. weight too high)</text>
        <text x={xs(96)} y={ys(v2[96]) - 8} textAnchor="end" fontSize="10" fill="#111">v2 · final 0.211</text>
      </svg>
    </div>
  );
}

/* § VII — Per-dimension F1 + RMSE table */
function EvalTable() {
  const rows = [
    ['Factuality',       0.91, 0.094, 0.96],
    ['Economic frame',   0.84, 0.118, 0.89],
    ['Social frame',     0.81, 0.126, 0.88],
    ['Establishment',    0.86, 0.108, 0.92],
    ['Sensationalism',   0.79, 0.131, 0.85],
    ['Loaded language',  0.88, 0.099, 0.94],
    ['Source diversity', 0.74, 0.142, 0.81],
    ['Headline / body',  0.82, 0.121, 0.87],
  ];
  return (
    <div className="border border-ink/30 bg-paper p-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3" style={{ fontFamily: 'Inter' }}>Figure 7 · Held-out evaluation · n = 12,000</div>
      <table className="w-full text-[12px]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
        <thead className="text-ink/55">
          <tr className="border-b border-ink/30">
            <th className="text-left py-1.5 pr-4" style={{ fontFamily: 'Inter' }}>Dimension</th>
            <th className="text-right py-1.5 px-3" style={{ fontFamily: 'Inter' }}>F1</th>
            <th className="text-right py-1.5 px-3" style={{ fontFamily: 'Inter' }}>RMSE</th>
            <th className="text-right py-1.5 px-3" style={{ fontFamily: 'Inter' }}>Human ceiling</th>
          </tr>
        </thead>
        <tbody className="text-ink/85">
          {rows.map(([k, f, r, h]) => (
            <tr key={k} className="border-b border-ink/10">
              <td className="py-1.5 pr-4" style={{ fontFamily: '"Source Serif 4", serif' }}>{k}</td>
              <td className="text-right py-1.5 px-3 tabular-nums">{f.toFixed(2)}</td>
              <td className="text-right py-1.5 px-3 tabular-nums text-ink/55">{r.toFixed(3)}</td>
              <td className="text-right py-1.5 px-3 tabular-nums text-ink/55">{h.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-[11px] text-ink/55" style={{ fontFamily: 'Inter' }}>Headline: <span className="text-ink">94.1%</span> bias-direction concordance with AllSides.</div>
    </div>
  );
}

/* § Saliency / attention rollout heatmap */
function AttentionRolloutFigure() {
  const tokens = ['the', 'reckless', 'GOP', 'plan', 'slammed', 'working', 'families', 'on', 'Thursday'];
  const weights = [0.10, 0.92, 0.84, 0.34, 0.88, 0.52, 0.61, 0.08, 0.18];
  return (
    <div className="border border-ink/30 bg-paper p-5">
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-3" style={{ fontFamily: 'Inter' }}>Figure 8 · Attention rollout (Abnar & Zuidema, 2020)</div>
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((t, i) => (
          <span key={i} className="px-2 py-1 text-[14px] text-ink" style={{ backgroundColor: `rgba(185, 28, 28, ${weights[i] * 0.7})`, fontFamily: '"Source Serif 4", serif' }}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-ink/55" style={{ fontFamily: 'Inter' }}>
        <span>low</span>
        <div className="flex-1 h-2" style={{ background: 'linear-gradient(to right, transparent, #B91C1C)' }} />
        <span>high</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  ArchitectureFigure, LossEquation, DatasetFunnel,
  TrainingLossChart, EvalTable, AttentionRolloutFigure,
});
