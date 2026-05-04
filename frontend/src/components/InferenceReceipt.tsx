import { MODEL } from '../lib/modelInfo'

type Props = {
  tokens?: number
  inferenceMs?: number
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export default function InferenceReceipt({ tokens, inferenceMs }: Props) {
  const t = tokens ?? 482
  const ms = inferenceMs ?? 843

  const rows: { label: string; value: string }[] = [
    { label: 'Model', value: MODEL.name },
    { label: 'Version', value: MODEL.version },
    { label: 'Tokens processed', value: formatNumber(t) },
    { label: 'Inference time', value: `${ms}ms` },
    { label: 'Trained on', value: MODEL.shortTagline },
  ]

  return (
    <section className="border border-ink/20 bg-paper font-sans text-ink">
      <header className="flex items-baseline justify-between border-b border-ink/15 px-5 py-3">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Inference receipt
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/55">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Resolved
        </span>
      </header>
      <dl className="divide-y divide-ink/10">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_auto] items-baseline gap-6 px-5 py-2.5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ink/55">{r.label}</dt>
            <dd className="font-mono text-[12px] tabular-nums text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
