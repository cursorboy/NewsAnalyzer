export default function TopicChips({
  chips,
  onClickChip,
  size = 'md',
}: {
  chips: string[]
  onClickChip?: (chip: string) => void
  size?: 'sm' | 'md'
}) {
  const cls =
    size === 'sm' ? 'text-[12px] px-3 py-1' : 'text-[13px] px-3.5 py-1.5'
  return (
    <div className="flex flex-wrap items-center gap-2 font-serif">
      <span className="mr-1 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45">
        Try
      </span>
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onClickChip?.(c)}
          className={`${cls} italic border border-ink/30 rounded-full text-ink/75 hover:bg-ink hover:text-paper-cream transition-colors`}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
