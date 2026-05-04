type Props = {
  tokens?: number
  loadedCount?: number
}

export default function InferenceTrace({ tokens, loadedCount }: Props) {
  const t = tokens ?? 482
  const lc = loadedCount ?? 7

  const steps: { label: string; sub?: string }[] = [
    { label: `Tokenized ${t.toLocaleString('en-US')} tokens`, sub: 'BPE-style segmentation' },
    { label: 'Encoded with comparison-bias embedding', sub: '768-dim editorial space' },
    { label: 'Compared against training corpus', sub: 'k-NN over training memory' },
    { label: `Surfaced ${lc} loaded phrases`, sub: 'lexical + contextual signals' },
    { label: 'Computed final bias vector across 8 dimensions', sub: 'eight independent classification heads' },
  ]

  return (
    <section className="border border-ink/15 bg-paper">
      <header className="flex items-baseline justify-between border-b border-ink/15 px-4 py-2.5">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55 font-sans">
          How the model thinks
        </span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-ink/45 font-sans">
          inference trace
        </span>
      </header>
      <ol className="px-4 py-4 font-sans">
        {steps.map((s, i) => (
          <li key={i} className="relative pl-8 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[9px] top-4 bottom-0 w-px bg-ink/15"
              />
            )}
            <span className="absolute left-0 top-0 inline-flex h-5 w-5 items-center justify-center border border-ink/30 bg-paper text-[10px] tabular-nums text-ink/70">
              {i + 1}
            </span>
            <div className="text-[12px] leading-snug text-ink">{s.label}</div>
            {s.sub && (
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-ink/45">
                {s.sub}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
