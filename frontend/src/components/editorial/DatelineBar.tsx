function todayDateline(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DatelineBar({
  left = 'Vol. II',
  no = 'No. v2.0.0',
  center,
  right,
}: {
  left?: string
  no?: string
  center?: string
  right?: string
}) {
  const date = right ?? todayDateline()
  return (
    <div className="border-t-[3px] border-ink">
      <div className="border-b border-ink/30">
        <div className="flex items-center justify-between gap-4 px-8 py-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/70">
          <span className="flex items-center gap-3">
            <span>{left}</span>
            <span className="text-ink/30" aria-hidden>·</span>
            <span>{no}</span>
          </span>
          {center ? (
            <span className="font-serif italic normal-case tracking-normal text-[12px] text-ink/75">
              {center}
            </span>
          ) : null}
          <span className="font-serif italic normal-case tracking-normal text-[12px] text-ink/75">
            {date}
          </span>
        </div>
      </div>
    </div>
  )
}
