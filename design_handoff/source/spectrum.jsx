/* SpectrumGraph — the real hero of the site.
   Search a topic → backend pulls articles → each plotted as a clipping
   along the saturated blue→red bias spectrum. */

const SAMPLE_ARTICLES = [
  { src: 'Jacobin',          short: 'JCB', x: -0.92, y: 0.38, title: 'Wall Street feasts as student debtors are forced back into payment' },
  { src: 'The Nation',       short: 'NTN', x: -0.81, y: 0.62, title: 'The cruelty of Republican student-loan repayment' },
  { src: 'MSNBC',            short: 'MSN', x: -0.74, y: 0.20, title: 'GOP plan would devastate borrowers, advocates warn' },
  { src: 'HuffPost',         short: 'HUF', x: -0.66, y: 0.74, title: 'Loan forgiveness in jeopardy under House proposal' },
  { src: 'Vox',              short: 'VOX', x: -0.58, y: 0.28, title: 'What the new repayment rules actually mean' },
  { src: 'NYT',              short: 'NYT', x: -0.34, y: 0.52, title: 'House bill tightens income-driven repayment terms' },
  { src: 'Washington Post',  short: 'WAP', x: -0.22, y: 0.18, title: 'Repayment overhaul advances in the House' },
  { src: 'NPR',              short: 'NPR', x: -0.10, y: 0.66, title: 'New rules for federal student loans take shape' },
  { src: 'Reuters',          short: 'RTR', x:  0.02, y: 0.34, title: 'House passes student-loan repayment overhaul' },
  { src: 'AP',               short: 'AP ', x:  0.05, y: 0.80, title: 'Republicans pass student loan repayment changes' },
  { src: 'Bloomberg',        short: 'BBG', x:  0.18, y: 0.22, title: 'Repayment overhaul: what borrowers should know' },
  { src: 'WSJ',              short: 'WSJ', x:  0.34, y: 0.56, title: 'Student-loan reform restores fiscal discipline' },
  { src: 'The Hill',         short: 'THL', x:  0.42, y: 0.30, title: 'Conservatives cheer repayment-rules overhaul' },
  { src: 'NY Post',          short: 'NYP', x:  0.61, y: 0.74, title: 'Finally, an end to the student-loan giveaway' },
  { src: 'National Review',  short: 'NRO', x:  0.68, y: 0.40, title: 'Returning student loans to the realm of personal responsibility' },
  { src: 'Fox News',         short: 'FOX', x:  0.78, y: 0.18, title: 'House Republicans rein in runaway loan forgiveness' },
  { src: 'The Federalist',   short: 'FED', x:  0.86, y: 0.62, title: 'The free ride is finally over for student-loan freeloaders' },
  { src: 'Daily Wire',       short: 'DW ', x:  0.91, y: 0.46, title: 'Republicans dismantle Biden-era loan handout' },
];

/* The spectrum hero — large-format, broadsheet-feeling.
   Width is fluid; pass `compact` for a smaller density. */
function SpectrumGraph({
  query = 'student loans',
  count = SAMPLE_ARTICLES.length,
  height = 360,
  compact = false,
  showAxis = true,
}) {
  const arts = SAMPLE_ARTICLES.slice(0, count);
  const padX = 56;
  const innerH = height - 120; // room for axis + labels
  return (
    <div className="relative w-full select-none" style={{ height }}>
      {/* Plot area */}
      <div className="absolute left-0 right-0" style={{ top: 24, height: innerH }}>
        {/* horizontal rules at quartiles */}
        {[0.25, 0.5, 0.75].map((t) => (
          <div key={t} className="absolute left-0 right-0 border-t border-dashed border-ink/12" style={{ top: `${t * 100}%` }} />
        ))}
        {/* center vertical */}
        <div className="absolute top-0 bottom-0 w-px bg-ink/20" style={{ left: '50%' }} />

        {/* article markers */}
        {arts.map((a, i) => {
          const left = `calc(${((a.x + 1) / 2) * 100}% )`;
          const top = `${a.y * 100}%`;
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left, top }}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full border border-ink/70 bg-paper shadow-[0_1px_0_rgba(0,0,0,0.08)]"
                  style={{ width: compact ? 8 : 10, height: compact ? 8 : 10 }}
                />
                <div
                  className="text-[9px] tabular-nums uppercase tracking-[0.14em] text-ink/55 whitespace-nowrap"
                  style={{ fontFamily: 'Inter' }}
                >
                  {a.short}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spectrum bar at bottom */}
      <div className="absolute left-0 right-0" style={{ bottom: 60 }}>
        <div className="relative h-[14px]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #1d3a8a 0%, #2563eb 18%, #93c5fd 38%, #e7e2d2 50%, #fca5a5 62%, #dc2626 82%, #7f1d1d 100%)',
            }}
          />
          {/* tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <div key={t} className="absolute top-full w-px bg-ink/40" style={{ left: `${t * 100}%`, height: 6 }} />
          ))}
        </div>
      </div>

      {/* Axis labels */}
      {showAxis && (
        <div className="absolute left-0 right-0 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ bottom: 22, fontFamily: 'Inter' }}>
          <span>← Far left</span>
          <span>Lean left</span>
          <span className="text-ink/75">Center</span>
          <span>Lean right</span>
          <span>Far right →</span>
        </div>
      )}

      {/* Title strip overlay */}
      <div className="absolute left-0 top-0 flex items-baseline gap-3 text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>
        <span>{arts.length} articles</span>
        <span className="text-ink/25">·</span>
        <span>"{query}"</span>
        <span className="text-ink/25">·</span>
        <span>past 24 hours</span>
      </div>

      {/* Aggregate stat at right */}
      <div className="absolute right-0 top-0 flex items-baseline gap-5 text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>
        <span><span className="font-display font-black text-ink mr-1.5 tabular-nums" style={{ fontFamily: '"Playfair Display", serif', fontSize: 16 }}>−0.04</span>avg</span>
        <span><span className="font-display font-black text-ink mr-1.5 tabular-nums" style={{ fontFamily: '"Playfair Display", serif', fontSize: 16 }}>0.71</span>spread</span>
        <span><span className="font-display font-black text-ink mr-1.5 tabular-nums" style={{ fontFamily: '"Playfair Display", serif', fontSize: 16 }}>14</span>outlets</span>
      </div>
    </div>
  );
}

/* Topic chips — the suggested queries */
function TopicChips({ chips = ['student loans', 'border policy', 'Ukraine aid', 'AI regulation', 'Fed rate cuts', 'EV mandates'], size = 'md' }) {
  const cls =
    size === 'sm'
      ? 'text-[12px] px-3 py-1'
      : 'text-[13px] px-3.5 py-1.5';
  return (
    <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: '"Source Serif 4", serif' }}>
      <span className="text-[11px] uppercase tracking-[0.22em] text-ink/45 mr-1" style={{ fontFamily: 'Inter' }}>Try</span>
      {chips.map((c) => (
        <span key={c} className={`${cls} italic border border-ink/30 rounded-full text-ink/75 hover:bg-ink hover:text-paper-cream transition-colors`}>
          {c}
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { SAMPLE_ARTICLES, SpectrumGraph, TopicChips });
