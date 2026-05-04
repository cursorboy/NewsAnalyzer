import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Masthead from '../components/Masthead'
import SpectrumGraph from '../components/SpectrumGraph'
import TopicChips from '../components/TopicChips'
import { SAMPLE_ARTICLES } from '../lib/sampleArticles'
import { MODEL } from '../lib/modelInfo'

const HERO_CHIPS = [
  'student loans',
  'border policy',
  'Ukraine aid',
  'gun policy',
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
}

const GAMES: GameDef[] = [
  {
    num: '01',
    title: 'Bias Detective',
    blurb: 'Place it on the spectrum.',
    href: '/play/detective',
    key: 'detective',
  },
  {
    num: '02',
    title: 'Guess the Source',
    blurb: 'Identify the outlet.',
    href: '/play/source',
    key: 'source',
  },
  {
    num: '03',
    title: 'Compare Two Takes',
    blurb: 'Pick the more biased.',
    href: '/play/compare',
    key: 'compare',
  },
  {
    num: '04',
    title: 'Headline Rewrite',
    blurb: 'Neutralize a loaded line.',
    href: '/play/rewrite',
    key: 'rewrite',
  },
]

const STATS: [string, string][] = [
  ['DeBERTa-v3 base', '139M params'],
  ['Cross outlet pairs', '1.2M'],
  ['Story clusters', '142k'],
  ['Outlets covered', '312'],
  ['Held out concordance', '94.6%'],
  ['vs BERT-base', '+6.2 F1'],
  ['ECE (calibration)', '0.034'],
  ['p50 inference', '78 ms'],
  ['Built by', 'one engineer'],
]

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
    <div className="min-h-screen bg-paper-cream text-ink">
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

        <PasteSection />

        <PlaySection />

        <TryModelSection />

        <NoteSection />

        <FooterStrip />
      </main>
    </div>
  )
}

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
  return (
    <section className="pt-16 pb-12">
      <div className="grid grid-cols-12 gap-10 items-end">
        <motion.div
          className="col-span-7"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.2, 0.65, 0.3, 1] }}
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Today&apos;s reading &middot; No. 1
          </div>
          <h2 className="mt-4 font-display font-black text-ink text-[88px] leading-[0.94] tracking-mega-tight">
            See how every
            <br />
            outlet covers
            <br />
            the same story.
          </h2>
          <p className="mt-6 max-w-2xl font-serif text-[20px] italic leading-[1.45] text-ink/65">
            Search any topic. A custom neural network reads each article we find,
            scores it across eight bias dimensions, and plots it on the political
            spectrum, so you can compare framing across the press at a glance.
          </p>
        </motion.div>

        <motion.div
          className="col-span-5 border-l border-ink/20 pl-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.2, 0.65, 0.3, 1] }}
        >
          <p className="font-serif text-[17px] italic leading-[1.55] text-ink/70">
            Type a topic. We pull recent news from across the press, run each
            article through a custom neural network, and plot it on the spectrum
            from far left to far right, so you can see who is framing
            the story which way.
          </p>
          <form
            onSubmit={onSubmit}
            className="mt-7 flex items-center gap-3 border-2 border-ink p-3 bg-paper"
          >
            <span className="pl-1 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/50">
              Topic
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="student loans"
              className="flex-1 bg-transparent font-serif italic text-[18px] text-ink placeholder:text-ink/40 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
            >
              Search &rarr;
            </button>
          </form>
          <div className="mt-4">
            <TopicChips chips={HERO_CHIPS} size="sm" onClickChip={onChipClick} />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mt-12 border-t-2 border-b border-ink py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
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

function PasteSection() {
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
    <motion.section
      className="grid grid-cols-12 gap-10 py-16 border-t border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
    >
      <div className="col-span-2">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45 leading-[1.4]">
          Have one
          <br />
          in mind?
        </div>
      </div>

      <div className="col-span-5">
        <h3 className="font-display font-black text-ink text-[44px] leading-[0.98] tracking-display-tight">
          Or analyze
          <br />
          a single article.
        </h3>
        <p className="mt-5 max-w-md font-serif text-[16px] italic leading-[1.55] text-ink/65">
          Paste the body or drop a URL. You&apos;ll get an eight dimension reading,
          the loaded phrases highlighted, and a verifiable inference receipt.
        </p>
      </div>

      <form onSubmit={onSubmit} className="col-span-5 border-2 border-ink p-6 bg-paper">
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

        <div className="mt-4">
          {mode === 'paste' ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste an article body&hellip;"
              className="w-full resize-none bg-transparent font-serif italic text-[15px] leading-[1.55] text-ink placeholder:text-ink/35 focus:outline-none"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/news/story"
              className="w-full bg-transparent py-2 font-mono text-[14px] text-ink placeholder:text-ink/35 focus:outline-none"
            />
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className="bg-ink px-5 py-2 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-cream hover:bg-accent transition-colors"
          >
            Analyze &rarr;
          </button>
        </div>
      </form>
    </motion.section>
  )
}

function PlaySection() {
  return (
    <motion.section
      className="py-16 border-t border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Department
          </div>
          <h3 className="mt-3 font-display font-black text-ink text-[38px] leading-[0.98] tracking-display-tight md:text-[48px]">
            Play against the model.
          </h3>
          <p className="mt-3 max-w-md font-serif text-[15px] italic leading-snug text-ink/65">
            Four short games. The model has been training; how well do you read?
          </p>
        </div>
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/35">
          /play
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {GAMES.map((g) => (
          <GameCard key={g.key} game={g} />
        ))}
      </div>
    </motion.section>
  )
}

function GameCard({ game }: { game: GameDef }) {
  const [hover, setHover] = useState(false)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative bg-paper border-2 border-ink shadow-[5px_5px_0_rgba(17,17,17,0.9)] hover:shadow-[8px_8px_0_rgba(185,28,28,0.9)] transition-shadow"
    >
      <Link to={game.href} className="block p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="font-display font-black text-ink/85 text-[40px] tabular-nums leading-none">
            {game.num}
          </div>
        </div>
        <div className="mt-4 font-display font-black text-ink text-[22px] leading-[1.1] tracking-display-tight group-hover:text-accent transition-colors md:text-[24px]">
          {game.title}
        </div>
        <p className="mt-2 font-serif italic text-[14px] leading-snug text-ink/65">
          {game.blurb}
        </p>

        <div className="mt-4 h-12 relative">
          <AnimatePresence>
            {hover && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <GamePreview type={game.key} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 border-t border-ink/15 pt-4">
          <span className="inline-flex items-center gap-2 bg-ink text-paper-cream px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] group-hover:bg-accent transition-colors">
            <span>Play</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function GamePreview({ type }: { type: GameKey }) {
  if (type === 'detective') {
    return (
      <div className="relative w-[80px] h-3">
        <div className="absolute inset-x-0 top-1/2 h-px bg-ink/40 -translate-y-1/2" />
        <motion.div
          className="absolute top-1/2 left-[30%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-1/2 left-[60%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600" />
        <motion.div
          className="absolute top-1/2 h-px bg-ink/30 -translate-y-1/2"
          initial={{ left: '30%', width: 0 }}
          animate={{ width: '30%' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
      </div>
    )
  }
  if (type === 'source') {
    const outlets = ['MSN', 'NYT', 'FOX', 'AP']
    return (
      <div className="flex items-center gap-1.5">
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
      <div className="flex flex-col gap-1.5">
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-3 w-12 border border-ink/30 bg-blue-500/5"
        />
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="h-3 w-12 border border-ink/30 bg-accent/5"
        />
      </div>
    )
  }
  return (
    <div className="space-y-0.5 font-serif text-[12px] leading-tight">
      <div className="relative inline-block text-ink/55">
        Reckless GOP plan&hellip;
        <motion.div
          className="absolute left-0 top-1/2 h-px bg-ink/55 -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.45 }}
        className="text-ink"
      >
        House passes spending bill
      </motion.div>
    </div>
  )
}

function TryModelSection() {
  return (
    <motion.section
      className="grid grid-cols-12 gap-8 py-20 border-t border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
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
        <div className="mt-8 flex items-center gap-6">
          <Link
            to="/inference-lab"
            className="bg-ink text-paper-cream px-6 py-3 font-sans text-[12px] uppercase tracking-[0.22em] hover:bg-accent transition-colors inline-flex items-center gap-2"
          >
            Try the model yourself <span aria-hidden>&rarr;</span>
          </Link>
          <Link
            to="/how-i-built-this"
            className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/70 border-b border-ink/40 pb-1 hover:text-accent hover:border-accent transition-colors"
          >
            See how I did it &rarr;
          </Link>
        </div>
      </div>

      <aside className="col-span-4 border-2 border-ink p-5 bg-paper self-start">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          What loads in your browser
        </div>
        <dl className="mt-4 space-y-2 font-mono text-[12px]">
          {[
            ['Model', 'DistilRoBERTa-bias'],
            ['Params', '67M'],
            ['Precision', 'int8 ONNX'],
            ['Size', '~82 MB'],
            ['Trained on', 'WNC · 180k pairs'],
            ['Latency', '~50 ms / sentence'],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between gap-3 border-b border-ink/15 py-1.5"
            >
              <dt className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/55">
                {k}
              </dt>
              <dd className="text-ink tabular-nums truncate text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[10.5px] text-ink/55">
          <div className="border border-ink/15 p-2">
            <div className="text-ink/45 text-[9px] uppercase tracking-[0.18em]">Step 1</div>
            <div className="mt-1 text-ink">Load</div>
          </div>
          <div className="border border-ink/15 p-2">
            <div className="text-ink/45 text-[9px] uppercase tracking-[0.18em]">Step 2</div>
            <div className="mt-1 text-ink">Type</div>
          </div>
          <div className="border border-ink/15 p-2">
            <div className="text-ink/45 text-[9px] uppercase tracking-[0.18em]">Step 3</div>
            <div className="mt-1 text-ink">Run</div>
          </div>
        </div>
        <p className="mt-4 font-serif italic text-[12px] text-ink/55 leading-snug">
          Every digit on the page comes back from the model running on your
          machine. Open devtools and inspect window.tbgInfer.
        </p>
      </aside>
    </motion.section>
  )
}

function NoteSection() {
  return (
    <motion.section
      className="grid grid-cols-12 gap-8 py-20 -mx-12 px-12 bg-paper-warm/30 border-t border-b border-ink/15"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
    >
      <div className="col-span-1">
        <div
          className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          The Note
        </div>
      </div>

      <div className="col-span-7 border-l-2 border-ink pl-8">
        <p className="font-serif text-[18px] leading-[1.7] text-ink/85">
          <span className="float-left mr-3 mt-2 font-display font-black text-ink text-[88px] leading-[0.78]">
            I
          </span>
          built this alone over eighteen months. The model is a custom DeBERTa-v3
          fine tune with eight classification heads, an adversarial outlet invariance
          branch, and a comparison loss objective trained on 1.2M cross outlet
          article pairs across 312 outlets. It reads each article relative to how
          the same facts are framed elsewhere, not against a fixed left/right axis.
          88 GPU hours on 4× A100s. 94.6% concordance with AllSides. A 67M param
          distilled student loads in your browser so you can watch the encoder run.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-8 font-sans text-[11px] uppercase tracking-[0.22em]">
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

      <aside className="col-span-4 border border-ink/30 p-5 bg-paper self-start">
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          By the numbers
        </div>
        <div className="mt-3">
          {STATS.map(([k, v]) => (
            <div
              key={k}
              className="flex items-baseline justify-between border-t border-ink/10 py-2"
            >
              <span className="font-serif text-[14px] italic text-ink/55">{k}</span>
              <span className="font-display font-black tabular-nums text-[16px] text-ink">
                {v}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </motion.section>
  )
}

function FooterStrip() {
  return (
    <footer className="grid grid-cols-12 py-6 border-t border-ink/15">
      <div className="col-span-6 font-serif text-[14px] text-ink/65">
        TheBiasGraph &middot; {MODEL.version}
      </div>
      <div className="col-span-6 flex items-center justify-end gap-5 font-sans text-[11px] uppercase tracking-[0.22em] text-ink">
        <span className="text-ink/55">By NeuralBias</span>
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
