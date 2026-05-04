import { Fleuron } from './SectionRule'

export default function PullQuote({
  children,
  attribution,
  size = 'md',
}: {
  children: React.ReactNode
  attribution?: string
  size?: 'md' | 'lg'
}) {
  const fontCls =
    size === 'lg'
      ? 'font-display text-3xl leading-[1.18] md:text-4xl md:leading-[1.15]'
      : 'font-display text-2xl leading-[1.22] md:text-[28px] md:leading-[1.2]'
  return (
    <figure className="my-10 px-2 text-center">
      <div className="mx-auto h-[3px] w-full max-w-2xl bg-ink" aria-hidden />
      <div className="mt-[3px] mx-auto border-t border-ink/30 max-w-2xl" aria-hidden />
      <blockquote
        className={`mx-auto mt-7 max-w-2xl italic text-ink ${fontCls}`}
      >
        <span className="font-display text-ink/35 mr-1">&ldquo;</span>
        {children}
        <span className="font-display text-ink/35 ml-1">&rdquo;</span>
      </blockquote>
      <div className="mt-7 flex items-center justify-center gap-3 text-ink/45" aria-hidden>
        <span className="block h-px w-12 bg-current" />
        <Fleuron />
        <span className="block h-px w-12 bg-current" />
      </div>
      {attribution && (
        <figcaption className="mt-3 font-sans text-[10px] uppercase tracking-[0.24em] text-ink/55">
          {attribution}
        </figcaption>
      )}
    </figure>
  )
}
