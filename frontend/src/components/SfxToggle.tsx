import { useSfxMuted, sfx } from '../lib/gameSound'

export default function SfxToggle({ className }: { className?: string }) {
  const [muted, toggle] = useSfxMuted()
  return (
    <button
      type="button"
      onClick={() => {
        sfx.unlock()
        toggle()
        if (muted) sfx.click()
      }}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      className={`font-sans text-[10px] uppercase tracking-[0.2em] border border-ink/25 px-2.5 py-1 hover:border-ink hover:text-ink active:scale-95 transition-all ${
        muted ? 'text-ink/45' : 'text-ink bg-amber-100/60 border-amber-500/60'
      } ${className ?? ''}`}
    >
      {muted ? 'Sound off' : 'Sound on'}
    </button>
  )
}
