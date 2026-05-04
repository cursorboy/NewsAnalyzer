import { ThinDiamond } from './SectionRule'

export default function SectionFlag({
  label,
  meta,
  align = 'left',
  className = '',
}: {
  label: string
  meta?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={className}>
      <div className="h-[3px] w-full bg-ink" aria-hidden />
      <div
        className={`flex items-center gap-3 py-2 ${
          align === 'center' ? 'justify-center text-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.28em] text-ink">
          <ThinDiamond />
          <span>{label}</span>
          <ThinDiamond />
        </div>
        {meta && align !== 'center' && (
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/45">
            {meta}
          </span>
        )}
      </div>
      <div className="border-t border-ink/30" aria-hidden />
      <div className="mt-[3px] h-[2px] bg-ink" aria-hidden />
    </div>
  )
}
