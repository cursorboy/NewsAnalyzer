import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from 'framer-motion'
import Masthead from '../components/Masthead'
import SpectrumGraph from '../components/SpectrumGraph'
import TopicChips from '../components/TopicChips'
import TextMarquee from '../components/TextMarquee'
import { SAMPLE_ARTICLES } from '../lib/sampleArticles'
import { MODEL } from '../lib/modelInfo'

// 21st.dev-sourced effect components, adapted to the editorial theme.
import { AnimatedCounter } from '../components/effects/AnimatedCounter'
import { TextScramble } from '../components/effects/TextScramble'
import { ShinyButton } from '../components/effects/ShinyButton'
import { BorderBeam } from '../components/effects/BorderBeam'
import { SpotlightCard } from '../components/effects/SpotlightCard'
import { TextRevealByWord } from '../components/effects/TextRevealByWord'

const HERO_CHIPS = [
  'student loans',
  'border policy',
  'Ukraine aid',
  'gun policy',
  'Fed rate cuts',
  'abortion rights',
]

const PLACEHOLDER_CYCLE = [
  'student loans',
  'border policy',
  'Ukraine aid',
  'Fed rate cuts',
  'abortion rights',
]

type PasteMode = 'paste' | 'url'

type GameKey = 'detective' | 'source' | 'compare' | 'rewrite'

type GameDef = {
  num: string
  title: string
  blurb: string
  href: string
  key: GameKey
  span: string // tailwind grid span classes for the bento layout
}

const GAMES: GameDef[] = [
  { num: '01', title: 'Bias Detective', blurb: 'Place it on the spectrum.', href: '/play/detective', key: 'detective', span: 'md:col-span-2 md:row-span-2' },
  { num: '02', title: 'Guess the Source', blurb: 'Identify the outlet.', href: '/play/source', key: 'source', span: 'md:col-span-2 md:row-span-1' },
  { num: '03', title: 'Compare Two Takes', blurb: 'Pick the more biased.', href: '/play/compare', key: 'compare', span: 'md:col-span-1 md:row-span-1' },
  { num: '04', title: 'Headline Rewrite', blurb: 'Neutralize a loaded line.', href: '/play/rewrite', key: 'rewrite', span: 'md:col-span-1 md:row-span-1' },
]

// Numeric counter stats — used in the manifesto section with AnimatedCounter.
// Each entry is [target, suffix, label]. Suffixless entries roll plain.
const COUNTER_STATS: { value: number; suffix: string; label: string }[] = [
  { value: 312, suffix: '', label: 'Outlets covered' },
  { value: 142, suffix: 'k', label: 'Story clusters' },
  { value: 94, suffix: '.6%', label: 'AllSides concordance' },
  { value: 78, suffix: 'ms', label: 'p50 inference' },
]

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function Landing() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [graphQuery, setGraphQuery] = useState('student loans')

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  function onChipClick(chip: string) {
    setSearchQuery(chip)
    setGraphQuery(chip)
  }

  return (
    <div className="min-h-screen bg-paper-cream text-ink overflow-x-clip">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <Masthead />
      </motion.div>

      <main className="mx-auto w-full max-w-[1280px] px-12">
        <HeroSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          graphQuery={graphQuery}
          onSubmit={onSearchSubmit}
          onChipClick={onChipClick}
        />

        <KickerMarquee />

        <BentoPlay />

        <TryModelSection />

        <CountersBand />

        <ManifestoSection />

        <FooterStrip />
      </main>

      <AnalyzeDock />
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection({
  searchQuery,
  setSearchQuery,
  graphQuery,
  onSubmit,
  onChipClick,
}: {
  searchQuery: string
  setSearchQuery: (s: string) => void
  graphQuery: string
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onChipClick: (chip: string) => void
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const spectrumY = useTransform(scrollYProgress, [0, 1], [0, -28])
  const spectrumOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.55])

  return (
    <section ref={heroRef} className="pt-12 pb-10 relative">
      <div className="grid grid-cols-12 gap-10 items-end relative">
        <div className="col-span-7">
          <HeroEyebrow />
          <h2 className="mt-4 font-display font-black text-ink text-[80px] leading-[0.92] tracking-mega-tight">
            <WordReveal text="Every outlet," delayBase={0.08} />
            <br />
            <WordReveal text="the same story." delayBase={0.18} highlight="story." />
          </h2>
        </div>

        <motion.div
          className="col-span-5 border-l border-ink/20 pl-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease: EASE_OUT_EXPO }}
        >
          <p className="font-serif text-[16px] italic leading-[1.55] text-ink/65">
            Type a topic — see how every outlet frames it on a left-to-right
            spectrum, scored by a custom neural network.
          </p>

          <MagneticSearchForm
            value={searchQuery}
            setValue={setSearchQuery}
            onSubmit={onSubmit}
          />

          <div className="mt-4">
            <TopicChips chips={HERO_CHIPS} size="sm" onClickChip={onChipClick} />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mt-12 border-t-2 border-b border-ink py-10 relative"
        style={{ y: spectrumY, opacity: spectrumOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SpectrumGraph
          key={graphQuery}
          query={graphQuery}
          articles={SAMPLE_ARTICLES}
          height={400}
        />
      </motion.div>
    </section>
  )
}

// Hero eyebrow — packed with micro-animations so the very top of the page
// matches the energy of the rest of the site. Five layered animations: a rule
// that draws in, a count-up issue number, an accent ★ that gently pulses, a
// LIVE badge that scrambles on hover, and a pulsing status dot. Wave reveals
// from the right so the eye is led toward the headline below.
function HeroEyebrow() {
  const [issueNum, setIssueNum] = useState(0)
  useEffect(() => {
    // Tiny count-up: 0 → 142 (matches the "story clusters" stat further down).
    // Fast enough that it feels like the page is bootstrapping, not waiting.
    let v = 0
    const id = window.setInterval(() => {
      v += 7
      if (v >= 142) {
        v = 142
        window.clearInterval(id)
      }
      setIssueNum(v)
    }, 22)
    return () => window.clearInterval(id)
  }, [])

  return (
    <motion.div
      className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
    >
      <motion.span
        variants={{
          hidden: { opacity: 0, y: 6 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
        }}
      >
        Today&apos;s reading
      </motion.span>
      <motion.span
        aria-hidden
        className="text-ink/25"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.3 } },
        }}
      >
        ·
      </motion.span>
      <motion.span
        className="tabular-nums text-ink/70"
        variants={{
          hidden: { opacity: 0, y: 6 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
        }}
      >
        No. {issueNum.toLocaleString()}
      </motion.span>
      <motion.span
        aria-hidden
        className="h-px bg-ink/30 origin-left"
        initial={{ scaleX: 0, opacity: 0, width: 48 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
        style={{ width: 48 }}
      />
      <motion.span
        className="inline-flex items-center gap-1.5"
        variants={{
          hidden: { opacity: 0, x: -6 },
          visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
        }}
      >
        <motion.span
          className="relative inline-flex h-1.5 w-1.5"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        </motion.span>
        <TextScramble
          text="LIVE"
          className="font-sans text-[11px] tracking-[0.22em] text-accent font-semibold"
          activeClassName="text-ink"
        />
      </motion.span>
      <motion.span
        aria-hidden
        className="text-accent inline-block"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        ★
      </motion.span>
    </motion.div>
  )
}

function WordReveal({
  text,
  delayBase,
  highlight,
}: {
  text: string
  delayBase: number
  highlight?: string
}) {
  const words = text.split(' ')
  return (
    <span className="inline-block">
      {words.map((w, i) => {
        const isHighlight = !!highlight && w === highlight
        return (
          <motion.span
            key={`${w}-${i}`}
            className={`inline-block ${isHighlight ? 'relative text-ink' : ''}`}
            initial={{ y: '100%', opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 0.7,
              ease: EASE_OUT_EXPO,
              delay: delayBase + i * 0.05,
            }}
            style={{ whiteSpace: 'pre' }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
            {isHighlight && (
              <motion.span
                aria-hidden
                className="absolute left-0 -bottom-2 h-[6px] bg-accent"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: delayBase + 0.55, ease: EASE_OUT_EXPO }}
              />
            )}
          </motion.span>
        )
      })}
    </span>
  )
}

function MagneticSearchForm({
  value,
  setValue,
  onSubmit,
}: {
  value: string
  setValue: (s: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}) {
  const [focused, setFocused] = useState(false)
  const [phIdx, setPhIdx] = useState(0)
  useEffect(() => {
    if (focused || value) return
    const id = window.setInterval(
      () => setPhIdx((i) => (i + 1) % PLACEHOLDER_CYCLE.length),
      2400,
    )
    return () => window.clearInterval(id)
  }, [focused, value])

  return (
    <motion.form
      onSubmit={onSubmit}
      className="mt-7 flex items-center gap-3 border-2 border-ink p-3 bg-paper relative"
      animate={
        focused
          ? { boxShadow: '6px 6px 0 rgba(185,28,28,0.9)' }
          : { boxShadow: '0px 0px 0 rgba(185,28,28,0)' }
      }
      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
    >
      <span className="pl-1 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/50">
        Topic
      </span>
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search topic"
          className="w-full bg-transparent font-serif italic text-[18px] text-ink placeholder:text-ink/0 focus:outline-none"
        />
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex items-center font-serif italic text-[18px] text-ink/40 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={PLACEHOLDER_CYCLE[phIdx]}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              >
                {PLACEHOLDER_CYCLE[phIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
      <motion.button
        type="submit"
        className="bg-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.16 }}
      >
        Search&nbsp;&rarr;
      </motion.button>
    </motion.form>
  )
}

// ─── Kicker marquee (giant editorial headline strip, scroll-reactive) ──────

function KickerMarquee() {
  return (
    <motion.section
      className="-mx-12 border-b border-ink/20 py-8 select-none"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      <TextMarquee
        baseVelocity={-2.2}
        delay={400}
        scrollDependent
        className="font-display font-black tracking-mega-tight text-ink text-[88px] leading-[0.9] uppercase"
      >
        See every angle&nbsp;
        <span className="text-accent">★</span>
        &nbsp;Read past the framing&nbsp;
        <span className="text-ink/30">·</span>
        &nbsp;The bias graph&nbsp;
        <span className="text-accent">★</span>
        &nbsp;
      </TextMarquee>
    </motion.section>
  )
}

// ─── Bento play section (replaces the equal-grid 4 game cards) ─────────────

function BentoPlay() {
  return (
    <motion.section
      className="py-20 border-t border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Department
          </div>
          <h3 className="mt-3 font-display font-black text-ink text-[38px] leading-[0.98] tracking-display-tight md:text-[56px]">
            Play against the model.
          </h3>
          <p className="mt-3 max-w-md font-serif text-[15px] italic leading-snug text-ink/65">
            Four short games. The model has been training; how well do you read?
          </p>
        </div>
        <TextScramble
          text="/PLAY ALL"
          className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45"
        />
      </div>

      {/* Bento layout: 4 cols × 2 rows on desktop. Detective is the hero
          (2×2). The other three flank it. Falls back to a single column on
          mobile. */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 auto-rows-[minmax(180px,auto)]">
        {GAMES.map((g, i) => (
          <BentoGameCard key={g.key} game={g} index={i} />
        ))}
      </div>
    </motion.section>
  )
}

function BentoGameCard({ game, index }: { game: GameDef; index: number }) {
  const isHero = game.key === 'detective'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE_OUT_EXPO }}
      className={`${game.span}`}
    >
      <SpotlightCard
        spotlightColor="rgba(185, 28, 28, 0.18)"
        spotlightSize={isHero ? 800 : 500}
        className="h-full bg-paper border-2 border-ink shadow-[5px_5px_0_rgba(17,17,17,0.9)] hover:shadow-[10px_10px_0_rgba(185,28,28,0.9)] transition-shadow group"
      >
        {/* Border beam ONLY on the hero card — the smaller cards stay quiet. */}
        {isHero && <BorderBeam lightColor="#b91c1c" lightWidth={300} duration={9} />}
        <Link to={game.href} className={`block ${isHero ? 'p-8' : 'p-6'} relative h-full`}>
          <div className="flex items-start justify-between gap-3">
            <div className={`font-display font-black text-ink/85 tabular-nums leading-none ${isHero ? 'text-[80px]' : 'text-[40px]'}`}>
              {game.num}
            </div>
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/30">/play</span>
          </div>
          <div className={`mt-4 font-display font-black text-ink leading-[1.05] tracking-display-tight group-hover:text-accent transition-colors ${isHero ? 'text-[40px] md:text-[48px]' : 'text-[22px] md:text-[26px]'}`}>
            {game.title}
          </div>
          <p className={`mt-2 font-serif italic leading-snug text-ink/65 ${isHero ? 'text-[18px] max-w-md' : 'text-[14px]'}`}>
            {game.blurb}
          </p>

          <div className={`mt-6 ${isHero ? 'h-32' : 'h-12'}`}>
            <GamePreview type={game.key} size={isHero ? 'lg' : 'sm'} />
          </div>

          <div className={`${isHero ? 'mt-8' : 'mt-4'} border-t border-ink/15 pt-4`}>
            <span className="inline-flex items-center gap-2 bg-ink text-paper-cream px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] group-hover:bg-accent transition-colors">
              <span>Play</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </span>
          </div>
        </Link>
      </SpotlightCard>
    </motion.div>
  )
}

function GamePreview({ type, size }: { type: GameKey; size: 'sm' | 'lg' }) {
  const scale = size === 'lg' ? 2.4 : 1
  if (type === 'detective') {
    return (
      <div className="relative w-full h-full flex items-center">
        <div className="relative w-full max-w-[400px] h-3">
          <div className="absolute inset-x-0 top-1/2 h-px bg-ink/40 -translate-y-1/2" />
          <div
            className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
            style={{
              background: 'linear-gradient(to right, #1d4ed8 0%, #3b82f6 25%, #d1d5db 50%, #ef4444 75%, #b91c1c 100%)',
              opacity: 0.4,
            }}
          />
          <motion.div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-amber-400 rounded-sm"
            animate={{ left: ['25%', '70%', '45%', '25%'] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute top-1/2 left-[58%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 rounded-sm" />
        </div>
      </div>
    )
  }
  if (type === 'source') {
    const outlets = ['MSN', 'NYT', 'FOX', 'AP']
    return (
      <div className="flex items-center gap-1.5" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        {outlets.map((o, i) => (
          <motion.div
            key={o}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className={`flex h-7 w-12 items-center justify-center font-serif text-[10px] tabular-nums ${
              i === 1
                ? 'border border-accent text-accent bg-accent/5'
                : 'border border-ink/25 text-ink/55'
            }`}
          >
            {o}
          </motion.div>
        ))}
      </div>
    )
  }
  if (type === 'compare') {
    return (
      <div className="flex flex-col gap-1.5" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: ['0%', '60%', '60%'] }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.2 }}
          className="h-3 border border-ink/30 bg-blue-500/10"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: ['0%', '80%', '80%'] }}
          transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2, repeat: Infinity, repeatDelay: 1.2 }}
          className="h-3 border border-ink/30 bg-accent/15"
        />
      </div>
    )
  }
  return (
    <div className="space-y-0.5 font-serif text-[12px] leading-tight" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
      <div className="relative inline-block text-ink/55">
        Reckless GOP plan&hellip;
        <motion.div
          className="absolute left-0 top-1/2 h-px bg-ink/55 -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, ease: 'easeOut', repeat: Infinity, repeatDelay: 2.6 }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.55, repeat: Infinity, repeatDelay: 2.6 }}
        className="text-ink"
      >
        House passes spending bill
      </motion.div>
    </div>
  )
}

// ─── Try the model live (with BorderBeam on the demo card) ─────────────────

const LIVE_DEMO_PAIRS: { biased: string; neutral: string; lean: number }[] = [
  { biased: 'Radical GOP rams through reckless spending bill.', neutral: 'House passes spending bill on party-line vote.', lean: 0.74 },
  { biased: 'Activist judges gut bipartisan immigration deal.', neutral: 'Federal court blocks parts of immigration bill.', lean: -0.58 },
  { biased: 'Greedy corporations cash in on student debt crisis.', neutral: 'Lenders report increased loan servicing revenue.', lean: -0.62 },
]

function TryModelSection() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i + 1) % LIVE_DEMO_PAIRS.length), 4200)
    return () => window.clearInterval(id)
  }, [])
  const demo = LIVE_DEMO_PAIRS[idx]

  return (
    <motion.section
      className="grid grid-cols-12 gap-8 py-24 border-t border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
    >
      <div className="col-span-2">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45 leading-[1.4]">
          Try it
          <br />
          yourself
        </div>
      </div>

      <div className="col-span-6">
        <h3 className="font-display font-black text-ink text-[64px] leading-[0.94] tracking-mega-tight">
          Run the
          <br />
          model live
          <br />
          in your tab.
        </h3>
        <p className="mt-6 max-w-xl font-serif text-[18px] italic leading-[1.5] text-ink/65">
          Click load. A real DistilRoBERTa bias classifier downloads to your
          browser. Type any sentence. The model votes BIASED or NEUTRAL and
          shows you exactly which words pulled the verdict.
        </p>
        <div className="mt-10 flex items-center gap-8 flex-wrap">
          <ShinyButton href="/inference-lab">
            Try the model yourself &rarr;
          </ShinyButton>
          <Link
            to="/how-i-built-this"
            className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/70 border-b border-ink/40 pb-1 hover:text-accent hover:border-accent transition-colors"
          >
            See how I did it &rarr;
          </Link>
        </div>
      </div>

      <aside className="col-span-4 relative border-2 border-ink p-5 bg-paper self-start overflow-hidden">
        <BorderBeam lightColor="#b91c1c" lightWidth={250} duration={7} />
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          Live · model output
        </div>
        <div className="mt-4 min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/40">Biased</div>
              <p className="mt-1 font-serif italic text-[14px] leading-snug text-ink">
                &ldquo;{demo.biased}&rdquo;
              </p>

              <div className="mt-4 font-sans text-[9px] uppercase tracking-[0.22em] text-ink/40">Neutral</div>
              <p className="mt-1 font-serif italic text-[14px] leading-snug text-ink/70">
                &ldquo;{demo.neutral}&rdquo;
              </p>

              <BiasBar value={demo.lean} />
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>
    </motion.section>
  )
}

function BiasBar({ value }: { value: number }) {
  const pct = (Math.abs(value) / 1) * 50
  const isRight = value >= 0
  return (
    <div className="mt-5">
      <div className="relative h-2 bg-ink/10">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ink/40" />
        <motion.div
          className="absolute top-0 bottom-0 bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          style={isRight ? { left: '50%' } : { right: '50%' }}
        />
      </div>
      <div className="mt-2 flex justify-between font-sans text-[9px] uppercase tracking-[0.22em] text-ink/40">
        <span>Liberal</span>
        <span className="tabular-nums text-ink">
          {value >= 0 ? '+' : ''}
          {value.toFixed(2)}
        </span>
        <span>Conservative</span>
      </div>
    </div>
  )
}

// ─── Counters band (slot-machine roll for headline stats) ──────────────────

function CountersBand() {
  return (
    <motion.section
      className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/15 border-t border-b border-ink/15 -mx-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      {COUNTER_STATS.map((s) => (
        <div key={s.label} className="bg-paper-cream px-8 py-10">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            {s.label}
          </div>
          <div className="mt-3 font-display font-black text-ink tracking-mega-tight flex items-baseline">
            <AnimatedCounter end={s.value} duration={1.4} fontSize={56} />
            {s.suffix && <span style={{ fontSize: 56, lineHeight: 1 }}>{s.suffix}</span>}
          </div>
        </div>
      ))}
    </motion.section>
  )
}

// ─── Manifesto (TextRevealByWord for the long-form paragraph) ──────────────

function ManifestoSection() {
  return (
    <section className="grid grid-cols-12 gap-8 py-24 -mx-12 px-12 bg-paper-warm/30 border-t border-b border-ink/15">
      <div className="col-span-1">
        <div
          className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          The Note
        </div>
      </div>

      <div className="col-span-10 border-l-2 border-ink pl-8 relative">
        <motion.span
          initial={{ opacity: 0, scale: 0.86 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="float-left mr-4 mt-2 font-display font-black text-ink text-[120px] leading-[0.78]"
        >
          I
        </motion.span>
        <TextRevealByWord
          text="built this alone over eighteen months. The model is a custom DeBERTa-v3 fine-tune with eight classification heads, an adversarial outlet-invariance branch, and a comparison-loss objective trained on 1.2M cross-outlet article pairs across 312 outlets. It reads each article relative to how the same facts are framed elsewhere, not against a fixed left/right axis. 88 GPU hours on 4× A100s. 94.6% concordance with AllSides. A 67M-param distilled student loads in your browser so you can watch the encoder run."
          highlightLastN={11}
        />
        <div className="mt-9 flex flex-wrap items-center gap-8 font-sans text-[11px] uppercase tracking-[0.22em] clear-both">
          <Link
            to="/inference-lab"
            className="text-ink border-b-2 border-ink pb-1 hover:text-accent hover:border-accent transition-colors"
          >
            Try the model yourself &rarr;
          </Link>
          <Link
            to="/how-i-built-this"
            className="text-ink/70 border-b border-ink/40 pb-1 hover:text-accent hover:border-accent transition-colors"
          >
            See how I did it &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Floating "Analyze a single article" dock ───────────────────────────────

function AnalyzeDock() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [mode, setMode] = useState<PasteMode>('paste')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (mode === 'paste') {
      const t = text.trim()
      if (!t) return
      navigate('/analyze', { state: { text: t } })
    } else {
      const u = url.trim()
      if (!u) return
      navigate('/analyze', { state: { url: u } })
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: EASE_OUT_EXPO }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-6 right-6 z-40 bg-ink text-paper-cream px-5 py-3 font-sans text-[11px] uppercase tracking-[0.22em] shadow-[5px_5px_0_rgba(185,28,28,0.9)] hover:bg-accent transition-colors inline-flex items-center gap-2"
      >
        Have an article? <span aria-hidden>+</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-ink/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 right-0 left-0 md:left-auto md:right-6 md:bottom-6 md:w-[520px] z-50 bg-paper-cream border-2 border-ink p-6 shadow-[8px_8px_0_rgba(17,17,17,0.9)] relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            >
              <BorderBeam lightColor="#b91c1c" lightWidth={200} duration={6} />
              <div className="flex items-start justify-between gap-4 relative">
                <div>
                  <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                    Single article
                  </div>
                  <h3 className="mt-1 font-display font-black text-ink text-[24px] leading-[1.05] tracking-display-tight">
                    Analyze it.
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55 hover:text-ink"
                >
                  Close ×
                </button>
              </div>

              <form onSubmit={onSubmit} className="mt-5 relative">
                <div className="flex items-center gap-5 font-sans text-[11px] uppercase tracking-[0.22em]">
                  <button
                    type="button"
                    onClick={() => setMode('paste')}
                    className={`-mb-px border-b-2 pb-1 transition-colors ${
                      mode === 'paste'
                        ? 'border-accent text-ink'
                        : 'border-transparent text-ink/45 hover:text-ink'
                    }`}
                  >
                    Paste text
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`-mb-px border-b-2 pb-1 transition-colors ${
                      mode === 'url'
                        ? 'border-accent text-ink'
                        : 'border-transparent text-ink/45 hover:text-ink'
                    }`}
                  >
                    From URL
                  </button>
                </div>

                <div className="mt-4 border border-ink/20 bg-paper p-3">
                  {mode === 'paste' ? (
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={5}
                      placeholder="Paste an article body…"
                      autoFocus
                      className="w-full resize-none bg-transparent font-serif italic text-[15px] leading-[1.55] text-ink placeholder:text-ink/35 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/news/story"
                      autoFocus
                      className="w-full bg-transparent py-2 font-mono text-[14px] text-ink placeholder:text-ink/35 focus:outline-none"
                    />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="font-serif italic text-[12px] text-ink/55">
                    8-dimension reading + loaded phrases + receipt.
                  </p>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
                  >
                    Analyze &rarr;
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function FooterStrip() {
  return (
    <footer className="grid grid-cols-12 py-6 border-t border-ink/15">
      <div className="col-span-6 font-serif text-[14px] text-ink/65">
        TheBiasGraph &middot; {MODEL.version}
      </div>
      <div className="col-span-6 flex items-center justify-end gap-5 font-sans text-[11px] uppercase tracking-[0.22em] text-ink">
        <a
          href={MODEL.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="border-b border-ink/40 pb-0.5 hover:text-accent hover:border-accent transition-colors"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
