type Kind = 'normal' | 'special' | 'continuation'

function classify(token: string): Kind {
  if (token === '[CLS]' || token === '[SEP]' || token === '[PAD]' || token === '[UNK]' || token === '[MASK]') {
    return 'special'
  }
  if (token.startsWith('##')) return 'continuation'
  return 'normal'
}

export default function TokenChip({
  token,
  id,
  active,
  onClick,
}: {
  token: string
  id: number
  active?: boolean
  onClick?: () => void
}) {
  const kind = classify(token)
  const base =
    'group inline-flex flex-col items-center border px-2 py-1 leading-tight transition-colors cursor-pointer select-none'
  const styles =
    kind === 'special'
      ? 'border-accent/60 bg-accent/[0.06] text-accent'
      : kind === 'continuation'
        ? 'border-ink/30 bg-ink/[0.04] text-ink/75'
        : 'border-ink/30 bg-paper text-ink hover:bg-ink/[0.04]'
  const activeRing = active ? 'outline outline-2 outline-offset-1 outline-accent' : ''
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles} ${activeRing}`}>
      <span className="font-mono text-[12px]">{token}</span>
      <span className="font-mono text-[9px] tabular-nums text-ink/45">{id}</span>
    </button>
  )
}
