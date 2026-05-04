import { Link, NavLink } from 'react-router-dom'
import ModelBadge from './ModelBadge'
import { MODEL } from '../lib/modelInfo'

function todayDateline(): string {
  const d = new Date()
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const NAV_ITEMS: { label: string; to: string }[] = [
  { label: 'Search', to: '/search' },
  { label: 'Analyze', to: '/analyze' },
  { label: 'Play', to: '/play' },
  { label: 'Try the model', to: '/inference-lab' },
  { label: 'How I did it', to: '/how-i-built-this' },
]

export default function Masthead({
  subtitle,
  right,
}: {
  subtitle?: string
  right?: string
}) {
  const dateline = right ?? todayDateline()
  const tagline = subtitle ?? 'A custom built neural network to detect article bias'
  return (
    <header className="bg-paper-cream">
      {/* 2px ink top rule */}
      <div className="border-t-2 border-ink" />

      {/* Nameplate row */}
      <div className="px-12 pt-8 pb-5">
        <div className="grid grid-cols-12 items-end gap-6">
          {/* Left col-3 — intentionally blank to balance the right col while
              keeping the masthead uncluttered. */}
          <div className="col-span-3" />


          {/* Center col-6 nameplate */}
          <Link
            to="/"
            className="col-span-6 flex flex-col items-center text-center"
          >
            <h1 className="font-display font-black text-[52px] leading-[0.95] tracking-mega-tight text-ink">
              TheBiasGraph
            </h1>
            <p className="mt-1 font-serif text-[13px] italic text-ink/60">
              {tagline}
            </p>
          </Link>

          {/* Right col-3 */}
          <div className="col-span-3 flex flex-col items-end gap-2 pb-1 text-right">
            <ModelBadge />
            <span className="font-serif italic text-[12px] text-ink/70">
              {dateline}
            </span>
          </div>
        </div>
      </div>

      {/* Hairline bottom rule */}
      <div className="border-b border-ink/20" />

      {/* Nav strip */}
      <div className="px-12 py-3 flex items-center justify-between gap-6 font-sans text-[11px] uppercase tracking-[0.2em]">
        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `text-ink/65 hover:text-ink transition-colors ${
                  isActive ? 'text-ink' : ''
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <span className="text-ink/55">By NeuralBias</span>
          <Link
            to="/analyze"
            className="border border-ink px-3 py-1 text-ink hover:bg-ink hover:text-paper-cream transition-colors"
          >
            Analyze {'→'}
          </Link>
        </div>
      </div>

      <div className="border-b border-ink/15" />
    </header>
  )
}
