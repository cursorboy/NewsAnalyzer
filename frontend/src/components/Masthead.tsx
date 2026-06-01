import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  AnimatePresence,
} from 'framer-motion'
import ModelBadge from './ModelBadge'
import { MODEL } from '../lib/modelInfo'
import { TextScramble } from './effects/TextScramble'

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

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function Masthead({
  subtitle,
  right,
}: {
  subtitle?: string
  right?: string
}) {
  const dateline = right ?? todayDateline()
  const tagline = subtitle ?? 'A custom built neural network to detect article bias'

  // Scroll-progress bar at the very top of the page. Uses framer's useScroll
  // and a spring to smooth the scaleX transform so the bar glides rather than
  // jumps with every wheel tick.
  const { scrollYProgress } = useScroll()
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    mass: 0.5,
  })

  return (
    <header className="bg-paper-cream relative">
      {/* Top 2px ink rule — draws in from left to right on mount, then carries
          a thin accent-red scroll-progress bar that fills as the user scrolls
          the page. Two visual layers, one purpose: alive top edge. */}
      <motion.div
        className="origin-left h-[2px] bg-ink"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.85, ease: EASE_OUT_EXPO, delay: 0.05 }}
      />
      <motion.div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] origin-left bg-accent z-50 pointer-events-none"
        style={{ scaleX: progressScale }}
      />

      {/* Nameplate row */}
      <div className="px-12 pt-8 pb-5">
        <div className="grid grid-cols-12 items-end gap-6">
          {/* Left col-3 — byline. Stagger-fade up. */}
          <motion.div
            className="col-span-3 flex flex-col gap-1 pb-1 font-sans text-[12px] uppercase tracking-[0.2em] font-semibold text-ink/75"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: EASE_OUT_EXPO }}
          >
            <span>Made by Piam Parekh</span>
            <DatelineFlicker dateline={dateline} />
          </motion.div>

          {/* Center col-6 nameplate — letter stagger reveal, then scramble on
              hover. */}
          <Link
            to="/"
            className="col-span-6 flex flex-col items-center text-center group"
          >
            <NameplateTitle text="TheBiasGraph" />
            <motion.p
              className="mt-1 font-serif text-[13px] italic text-ink/60"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.78, ease: EASE_OUT_EXPO }}
            >
              {tagline}
            </motion.p>
          </Link>

          {/* Right col-3 — model status. Stagger-fade up. */}
          <motion.div
            className="col-span-3 flex flex-col items-end gap-2 pb-1 text-right"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: EASE_OUT_EXPO }}
          >
            <ModelBadge />
            <span className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-emerald-700">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-60" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
              </span>
              Status &middot; Online
            </span>
            <TextScramble
              text={`${MODEL.name} · ${MODEL.version}`}
              className="font-sans text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/70 tabular-nums"
              activeClassName="text-accent"
            />
          </motion.div>
        </div>
      </div>

      {/* Hairline bottom rule */}
      <div className="border-b border-ink/20" />

      {/* Nav strip — animated underline that slides between active items. */}
      <AnimatedNavStrip />

      <div className="border-b border-ink/15" />
    </header>
  )
}

// Letter-stagger nameplate with blur-in. Hovering re-shimmers each letter.
function NameplateTitle({ text }: { text: string }) {
  const letters = text.split('')
  return (
    <h1 className="font-display font-black text-[52px] leading-[0.95] tracking-mega-tight text-ink relative">
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block group-hover:text-accent transition-colors duration-300"
          initial={{ y: '60%', opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.65,
            delay: 0.18 + i * 0.04,
            ease: EASE_OUT_EXPO,
          }}
          style={{ transitionDelay: `${i * 18}ms` }}
        >
          {ch}
        </motion.span>
      ))}
      {/* Accent underline draws in once the letters settle. */}
      <motion.span
        aria-hidden
        className="absolute left-0 right-0 -bottom-[6px] h-[3px] bg-accent origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.65, ease: EASE_OUT_EXPO }}
      />
    </h1>
  )
}

// Dateline that briefly scrambles on mount, then settles. Adds a "ticker just
// landed" feel without being noisy on subsequent renders.
function DatelineFlicker({ dateline }: { dateline: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 450)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <span className="text-ink/45 normal-case tracking-normal font-serif italic text-[12px] min-h-[1em]">
      <AnimatePresence mode="wait">
        {show && (
          <motion.span
            key="dateline"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            {dateline}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// Nav strip with a single animated underline that slides between the active
// item and the hovered item. Each item also fades in with a stagger.
function AnimatedNavStrip() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  })
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  // Find the active nav index (longest matching prefix wins).
  const activeIdx = (() => {
    let best = -1
    let bestLen = -1
    NAV_ITEMS.forEach((it, i) => {
      if (
        location.pathname === it.to ||
        (it.to !== '/' && location.pathname.startsWith(it.to + '/'))
      ) {
        if (it.to.length > bestLen) {
          bestLen = it.to.length
          best = i
        }
      }
    })
    return best
  })()

  // Move the underline indicator to whichever item is hovered (or active when
  // nothing is hovered). Recomputes on resize and on route change.
  useEffect(() => {
    const target = hoverIdx ?? activeIdx
    const el = target >= 0 ? itemRefs.current[target] : null
    const container = containerRef.current
    if (!el || !container) {
      setIndicator((s) => ({ ...s, visible: false }))
      return
    }
    const elRect = el.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    setIndicator({
      left: elRect.left - cRect.left,
      width: elRect.width,
      visible: true,
    })
  }, [hoverIdx, activeIdx, location.pathname])

  // Three-column layout: empty spacer | centered nav | right-aligned CTA.
  // Spacer matches the CTA's width so the nav stays optically centered in the
  // strip (instead of being shoved by the CTA's presence on one side).
  return (
    <div className="px-12 py-3.5 grid grid-cols-[1fr_auto_1fr] items-center gap-6 font-sans text-[13px] uppercase tracking-[0.18em] font-semibold">
      <div aria-hidden />
      <nav
        ref={containerRef}
        className="relative flex items-center gap-8 justify-self-center"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Underline indicator — slides between items. */}
        <motion.span
          aria-hidden
          className="absolute -bottom-1 h-[2px] bg-accent pointer-events-none"
          animate={{
            left: indicator.left,
            width: indicator.width,
            opacity: indicator.visible ? 1 : 0,
          }}
          transition={{
            left: { type: 'spring', stiffness: 380, damping: 32 },
            width: { type: 'spring', stiffness: 380, damping: 32 },
            opacity: { duration: 0.15 },
          }}
        />
        {NAV_ITEMS.map((it, i) => (
          <motion.div
            key={it.to}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.05, ease: EASE_OUT_EXPO }}
            onMouseEnter={() => setHoverIdx(i)}
          >
            <NavLink
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `relative inline-block py-1 transition-colors ${
                  isActive ? 'text-ink' : 'text-ink/75 hover:text-ink'
                }`
              }
            >
              {it.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
      <motion.div
        className="flex items-center gap-5 justify-self-end"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.95, ease: EASE_OUT_EXPO }}
      >
        <Link
          to="/analyze"
          className="border border-ink px-3.5 py-1.5 text-ink hover:bg-ink hover:text-paper-cream transition-colors"
        >
          Analyze {'→'}
        </Link>
      </motion.div>
    </div>
  )
}
