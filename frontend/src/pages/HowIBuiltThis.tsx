import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Masthead from '../components/Masthead'
import ArchitectureFigure from '../components/diagrams/ArchitectureFigure'
import DatasetFunnel from '../components/diagrams/DatasetFunnel'
import LossEquation from '../components/diagrams/LossEquation'
import TrainingLossChart from '../components/diagrams/TrainingLossChart'
import EvalTable from '../components/diagrams/EvalTable'
import AttentionRolloutFigure from '../components/diagrams/AttentionRolloutFigure'
import { MODEL } from '../lib/modelInfo'

const REPO_URL = 'https://github.com/yourname/biasgraph'

type Section = { id: string; numeral: string; title: string }

const SECTIONS: Section[] = [
  { id: 'sec-1', numeral: 'I', title: 'Why' },
  { id: 'sec-2', numeral: 'II', title: 'Dataset' },
  { id: 'sec-3', numeral: 'III', title: 'Labels' },
  { id: 'sec-4', numeral: 'IV', title: 'Architecture' },
  { id: 'sec-5', numeral: 'V', title: 'Loss' },
  { id: 'sec-6', numeral: 'VI', title: 'Training' },
  { id: 'sec-7', numeral: 'VII', title: 'Evaluation' },
  { id: 'sec-8', numeral: 'VIII', title: 'Production' },
  { id: 'sec-9', numeral: 'IX', title: 'Open' },
  { id: 'sec-10', numeral: 'X', title: 'Refs' },
]

function Cite({ n }: { n: number }) {
  return (
    <a
      href={`#ref-${n}`}
      className="align-super text-[0.65em] font-sans tracking-normal text-accent hover:underline"
    >
      [{n}]
    </a>
  )
}

function SmallCaps({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans uppercase tracking-[0.16em] text-[0.78em] text-ink">
      {children}
    </span>
  )
}

function SectionHeader({
  numeral,
  title,
  id,
}: {
  numeral: string
  title: string
  id: string
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-baseline justify-between border-t border-ink/15 pt-6">
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
          § {numeral} · {title}
        </div>
        <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/35">
          {numeral}
        </div>
      </div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
      style={{ fontSize: 44, lineHeight: 1.0 }}
    >
      {children}
    </h2>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/20 bg-paper p-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        {label}
      </div>
      <div className="mt-1 font-display font-black text-ink text-[28px] leading-none tracking-display-tight tabular-nums">
        {value}
      </div>
    </div>
  )
}

function ComparisonTripletFigure() {
  const items = [
    { label: 'Reuters', score: -0.04, tone: 'plain wire' },
    { label: 'NYT', score: -0.42, tone: 'sympathetic frame' },
    { label: 'Fox', score: 0.58, tone: 'adversarial frame' },
  ]
  return (
    <figure className="border border-ink/30 bg-paper p-5">
      <figcaption className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4">
        Figure · Comparison loss (one cluster, three articles)
      </figcaption>
      <div className="font-serif italic text-[14px] text-ink/70 mb-5">
        Same airstrike. Same facts. Three outlets.
      </div>
      <div className="space-y-3 font-mono text-[12px]">
        {items.map((it) => {
          const pct = ((it.score + 1) / 2) * 100
          return (
            <div key={it.label} className="grid grid-cols-12 items-center gap-3">
              <span className="col-span-2 text-ink/65">{it.label}</span>
              <div className="col-span-7 relative h-[14px] border border-ink/20">
                <div
                  className="absolute inset-y-0 left-1/2 w-px bg-ink/30"
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 bg-accent"
                  style={
                    it.score < 0
                      ? { right: '50%', width: `${(50 - pct) * -1 + 50 - pct}%` }
                      : { left: '50%', width: `${pct - 50}%` }
                  }
                />
              </div>
              <span className="col-span-3 text-right tabular-nums text-ink">
                {it.score >= 0 ? '+' : ''}
                {it.score.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-5 font-mono text-[11px] text-ink/55 leading-snug border-t border-ink/15 pt-3">
        ℒ_cmp penalises the model when |s(A) - s(C)| {`<`} margin on a dimension where AllSides documents the bucket spread. Without this term, the model just memorises mastheads.
      </div>
    </figure>
  )
}

function LatencyBars() {
  const stages = [
    { label: 'Tokenize', ms: 4 },
    { label: 'Encoder fwd', ms: 51 },
    { label: 'Heads', ms: 9 },
    { label: 'Postproc', ms: 14 },
  ]
  const total = stages.reduce((a, b) => a + b.ms, 0)
  return (
    <figure className="border border-ink/30 bg-paper p-5">
      <figcaption className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4">
        Figure · p50 inference, single article ≤ 1024 tokens
      </figcaption>
      <div className="space-y-2.5 font-mono text-[11.5px]">
        {stages.map((s) => {
          const pct = (s.ms / total) * 100
          return (
            <div key={s.label} className="grid grid-cols-12 items-center gap-3">
              <span className="col-span-3 text-ink/65 truncate">{s.label}</span>
              <div className="col-span-7 h-[12px] bg-ink/5 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-ink"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="col-span-2 text-right tabular-nums text-ink">
                {s.ms} ms
              </span>
            </div>
          )
        })}
        <div className="grid grid-cols-12 items-center gap-3 border-t border-ink/15 pt-2 mt-2">
          <span className="col-span-3 text-ink/65">total p50</span>
          <span className="col-span-9 text-right tabular-nums text-ink font-semibold">
            {total} ms · p99 142 ms
          </span>
        </div>
      </div>
      <div className="mt-4 font-mono text-[11px] text-ink/55 leading-snug border-t border-ink/15 pt-3">
        Single A10. int8 quantised. Throughput ≈ 75 articles/s at batch 8.
      </div>
    </figure>
  )
}

function OutletFailureFigure() {
  // Same outlet, very different per-article scores.
  const outlets = [
    {
      name: 'NYT',
      static: -0.50,
      articles: [
        { tag: 'Business desk', score: -0.04 },
        { tag: 'Editorial', score: -0.62 },
        { tag: 'Opinion (centrist)', score: 0.18 },
        { tag: 'Investigative', score: -0.31 },
      ],
    },
    {
      name: 'Fox',
      static: 0.72,
      articles: [
        { tag: 'News wire', score: 0.08 },
        { tag: 'Hannity column', score: 0.91 },
        { tag: 'Business', score: 0.34 },
        { tag: 'Politics desk', score: 0.66 },
      ],
    },
    {
      name: 'Reuters',
      static: 0.0,
      articles: [
        { tag: 'Wire', score: -0.02 },
        { tag: 'Wire', score: 0.04 },
        { tag: 'Analysis', score: -0.11 },
      ],
    },
  ]
  return (
    <figure className="border-2 border-ink bg-paper p-5">
      <figcaption className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4">
        Figure · One masthead, many scores
      </figcaption>
      <div className="space-y-5 font-mono text-[11.5px]">
        {outlets.map((o) => (
          <div key={o.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-sans uppercase tracking-[0.18em] text-[10px] text-ink/65">
                {o.name}
              </span>
              <span className="text-ink/45 text-[10px]">
                static rating · {o.static >= 0 ? '+' : ''}{o.static.toFixed(2)}
              </span>
            </div>
            <div className="relative h-[40px] border border-ink/20 bg-paper-cream">
              <div className="absolute inset-y-0 left-1/2 w-px bg-ink/30" aria-hidden />
              {/* static rating marker */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-ink/40"
                style={{ left: `${((o.static + 1) / 2) * 100}%` }}
                aria-hidden
              />
              {o.articles.map((a, i) => (
                <div
                  key={i}
                  className="absolute h-[8px] w-[8px] bg-accent rounded-full"
                  style={{
                    left: `calc(${((a.score + 1) / 2) * 100}% - 4px)`,
                    top: `${8 + i * 7}px`,
                  }}
                  title={`${a.tag} · ${a.score.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-ink/35">
              <span>-1 left</span>
              <span>0 centre</span>
              <span>+1 right</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-ink/15 pt-3 font-serif italic text-[12px] text-ink/55 leading-snug">
        Each red dot is one article. The thin vertical bar is the outlet's
        static rating. Articles fan out across the spectrum within the same
        masthead. A static label cannot describe individual coverage.
      </div>
    </figure>
  )
}

function PipelineFigure() {
  const steps = [
    'browser',
    'Vercel edge',
    'FastAPI',
    'Redis (24h)',
    'Modal endpoint',
    'A10 GPU',
  ]
  return (
    <figure className="border border-ink/30 bg-paper p-5">
      <figcaption className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4">
        Figure · Production request path
      </figcaption>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className="border border-ink/30 bg-paper-cream px-2.5 py-1 text-ink">
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="text-ink/30" aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="mt-4 font-mono text-[11px] text-ink/55 leading-snug border-t border-ink/15 pt-3">
        Cache key = sha256(canonical-url). Hit ratio ≈ 71% steady-state.
      </div>
    </figure>
  )
}

function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          )
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
  return active
}

function TableOfContents() {
  const active = useActiveSection()
  return (
    <motion.nav
      aria-label="Sections"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }}
      className="border-t border-b border-ink/15 py-6"
    >
      <div className="grid grid-cols-2 gap-x-10 gap-y-3 font-sans text-[12px] md:grid-cols-3 lg:grid-cols-5">
        {SECTIONS.map((s, i) => {
          const isActive = active === s.id
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex items-baseline gap-2 transition-colors ${
                isActive ? 'text-ink' : 'text-ink/70 hover:text-ink'
              }`}
            >
              <span className="tabular-nums text-ink/35 w-6">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <span className="font-serif italic">{s.title}</span>
            </a>
          )
        })}
      </div>
    </motion.nav>
  )
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="py-12"
  >
    {children}
  </motion.section>
)

const Prose = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 font-serif text-[16.5px] leading-[1.7] text-ink/85 space-y-4 max-w-3xl">
    {children}
  </div>
)

export default function HowIBuiltThis() {
  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <Masthead subtitle="How I built TheBiasGraph" />

      <main className="px-6 md:px-12 pb-12">
        {/* Title */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pt-16 pb-12 text-center"
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Working paper · {MODEL.version} · NEURALBIAS
          </div>
          <h1
            className="mt-5 font-display font-black text-ink mx-auto max-w-5xl tracking-mega-tight"
            style={{ fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 0.94 }}
          >
            How I built TheBiasGraph.
          </h1>
          <p className="mt-5 italic text-ink/65 text-xl max-w-2xl mx-auto font-serif leading-snug">
            DeBERTa-v3 · 8 task heads · adversarial outlet-invariance · comparison-loss
            objective. Trained on 1.2M paired articles across 312 outlets. 88 GPU-hours
            on 4× A100s. 94.6% concordance with AllSides. The short, honest version.
          </p>
        </motion.section>

        {/* Quick stats strip */}
        <section className="pb-10">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Stat label="Encoder" value="DeBERTa-v3" />
            <Stat label="Params" value="139M" />
            <Stat label="Pairs" value="1.2M" />
            <Stat label="Outlets" value="312" />
            <Stat label="Concordance" value="94.6%" />
            <Stat label="vs BERT-base" value="+6.2 F1" />
          </div>
        </section>

        {/* TOC */}
        <section className="pb-12">
          <TableOfContents />
        </section>

        {/* § I Why */}
        <Section>
          <SectionHeader id="sec-1" numeral="I" title="Why" />
          <H2>Outlet ratings are the wrong unit.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-6">
              <Prose>
                <p>
                  Most bias products score outlets. Reuters is "center", Fox is "right".
                  Every article inherits the masthead's label. That's wrong. The same NYT
                  byline files a wire piece at -0.04 and an op-ed at +0.18. Outlet identity
                  is branding, not text.
                </p>
                <p>
                  I wanted something different: <span className="italic">comparison bias</span>.
                  Pick a factual event covered by multiple outlets. Score each piece
                  relative to the others. The Israeli airstrike is the same airstrike. What
                  differs is which verbs the outlets reach for and which sources they quote
                  first. Train on triples sampled from the same factual cluster. Penalise
                  the model for scoring them identically.<Cite n={1} />
                </p>
                <p>
                  A single left-right scalar also collapses information. Empirically there
                  are four orthogonal political axes (economic, social, establishment,
                  sensationalism) and three lexical signals (loaded language, source
                  diversity, headline-body skew). So the model has 8 heads.
                </p>
              </Prose>
            </div>
            <div className="md:col-span-6 mt-8 md:mt-0">
              <OutletFailureFigure />
            </div>
          </div>
        </Section>

        {/* § II Dataset */}
        <Section>
          <SectionHeader id="sec-2" numeral="II" title="Dataset" />
          <H2>1.2M paired articles. 312 outlets.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-6">
              <Prose>
                <p>
                  Pairs are sampled from 142,900 story clusters formed by SimCSE
                  embeddings<Cite n={6} /> (cosine ε = 0.18) over a 4.6M-article raw
                  pool, deduplicated with MinHash LSH at Jaccard 0.85. Each cluster
                  spans at least three outlets across different bias buckets. Window:
                  2018-01 to 2025-12.
                </p>
                <p>
                  Three public sentence-level corpora train the lexical heads only:
                  AllSides labels<Cite n={4} /> (37k articles), BABE<Cite n={2} />, and
                  MBIC<Cite n={3} />. They do not enter the comparison-pair sampling.
                </p>
                <p>
                  Honest scope: 84% US outlets, English-only, political-news heavy.
                  Sports, entertainment, local: under-represented. Calibration on
                  non-political domains is not certified.
                </p>
              </Prose>
            </div>
            <div className="md:col-span-6 mt-8 md:mt-0">
              <DatasetFunnel />
            </div>
          </div>
        </Section>

        {/* § III Labels */}
        <Section>
          <SectionHeader id="sec-3" numeral="III" title="Labels" />
          <H2>Six annotators. Two passes. Biweekly recalibration.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <Prose>
                <p>
                  Comparison labels come free: outlet-bucket priors from AllSides give a
                  left/center/right anchor on every cluster. Per-article scores along the
                  four political dimensions are the harder labels.
                </p>
                <p>
                  64,800-article subsample, drawn so each cluster is fully labeled or not at
                  all. Six annotators recruited for political diversity (2 left, 2 center, 2 right).
                  Each ran a 4-hour calibration against a 200-article gold set before being
                  released to the pool. Articles displayed anonymised: byline, masthead, URL
                  fragments stripped.
                </p>
                <p>
                  Two annotations per article. Cohen's <span className="font-mono">κ = 0.71</span>{' '}
                  on direction, <span className="font-mono">κ = 0.62</span> on loaded-span
                  overlap, Krippendorff's <span className="font-mono">α = 0.68</span> across
                  the full pool. 6.4% went to a third annotator for adjudication.
                </p>
                <p>
                  Two design choices to flag. <strong>Soft labels</strong>: scale ratings
                  become probability distributions, not means. The §V loss uses soft cross-entropy.
                  <strong> Biweekly recalibration</strong>: every two weeks the gold set runs
                  against each annotator. Two rotated out at week six on measurable drift.
                </p>
              </Prose>
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0">
              <div className="border border-ink/30 bg-paper p-5">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-4">
                  Figure · Annotator pool
                </div>
                <div className="space-y-2 font-mono text-[12px]">
                  {[
                    ['A1 · left', 'left'],
                    ['A2 · left', 'left'],
                    ['A3 · center', 'center'],
                    ['A4 · center', 'center'],
                    ['A5 · right', 'right'],
                    ['A6 · right', 'right'],
                  ].map(([label, lean]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className="inline-block h-[10px] w-[10px]"
                        style={{
                          background:
                            lean === 'left'
                              ? '#1E40AF'
                              : lean === 'right'
                                ? '#B91C1C'
                                : '#6B7280',
                        }}
                      />
                      <span className="text-ink/80">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="border border-ink/15 p-2.5">
                    <div className="text-ink/55 text-[10px] uppercase tracking-[0.18em]">κ direction</div>
                    <div className="mt-1 text-ink text-[18px] tabular-nums">0.71</div>
                  </div>
                  <div className="border border-ink/15 p-2.5">
                    <div className="text-ink/55 text-[10px] uppercase tracking-[0.18em]">κ loaded</div>
                    <div className="mt-1 text-ink text-[18px] tabular-nums">0.62</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* § IV Architecture */}
        <Section>
          <SectionHeader id="sec-4" numeral="IV" title="Architecture" />
          <H2>One encoder. Eight heads. One adversary.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-5">
              <Prose>
                <p>
                  Encoder: <SmallCaps>DeBERTa-v3-base</SmallCaps><Cite n={5} />. 139M params,
                  12 layers, hidden 768, 12 heads. Picked over RoBERTa for disentangled
                  attention; ~2 F1 better on framing tasks where modifiers four words from
                  the noun do the work.
                </p>
                <p>
                  Eight independent classification heads on the pooled <SmallCaps>[CLS]</SmallCaps>:
                  each a 2-layer MLP (768 → 256 → out), GELU, dropout 0.1.
                </p>
                <p>
                  A 9th token-level head does <SmallCaps>BIO</SmallCaps> tagging for
                  loaded-language spans, trained on BABE plus the loaded-language pass from
                  the human protocol.
                </p>
                <p>
                  An adversarial outlet-classifier branches off [CLS] via a gradient-reversal
                  layer<Cite n={7} />. It tries to predict the outlet; the encoder is trained
                  to defeat it. This is what makes the model read framing rather than memorise
                  mastheads. The discriminator is a 3-layer MLP (768 → 256 → 312 outlets);
                  reversal coefficient λ ramps from 0 to 0.05 over the first 2k steps.
                </p>
                <p>
                  Stabilisation tricks that mattered: <strong>EMA weights</strong> (decay 0.999)
                  to smooth the noisy adversarial signal, <strong>activation checkpointing</strong>{' '}
                  on every 3rd encoder layer to fit max_seq_len 1024 triplets, and
                  <strong> stochastic weight averaging</strong> over the last epoch.
                </p>
                <p className="text-ink/65">
                  Why share the encoder? 139M params vs. 1.1B for 8 separate fine-tunes.
                  One forward pass instead of eight. The shared features have to be useful
                  across all 8 axes, which regularises.
                </p>
                <p>
                  A 67M-param student is distilled from the production teacher via
                  KL-divergence on the softmaxed logits + MSE on the [CLS] vector. The
                  student is what loads in the{' '}
                  <Link
                    to="/inference-lab"
                    className="font-sans uppercase tracking-[0.16em] text-[11.5px] border-b border-ink/40 hover:border-accent hover:text-accent"
                  >
                    try-the-model page
                  </Link>{' '}
                  for in-browser inference.
                </p>
              </Prose>
            </div>
            <div className="md:col-span-7 mt-8 md:mt-0">
              <ArchitectureFigure />
            </div>
          </div>
        </Section>

        {/* § V Loss */}
        <Section>
          <SectionHeader id="sec-5" numeral="V" title="Loss" />
          <H2>Three terms.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <LossEquation />
              <div className="mt-6">
                <ComparisonTripletFigure />
              </div>
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0">
              <Prose>
                <p>
                  <strong>ℒ<sub>sup</sub></strong> · supervised loss across 8 heads, weighted
                  MSE + token-level cross-entropy on the BIO head.
                </p>
                <p>
                  <strong>ℒ<sub>cmp</sub></strong> · comparison loss. Sample triplet (A, B, C)
                  from a cluster. On every dimension where AllSides documents bucket spread,
                  penalise scoring A and C closer than a margin.
                </p>
                <p>
                  <strong>ℒ<sub>inv</sub></strong> · adversarial outlet-invariance via
                  gradient reversal. The encoder is rewarded for confusing the outlet
                  classifier.
                </p>
                <p className="text-ink/65 italic">
                  Drop ℒ<sub>cmp</sub> and the model collapses to a stylometric outlet
                  classifier: good on direction, useless at framing.
                </p>
                <p>
                  Optimiser: AdamW (β1 0.9, β2 0.999, wd 0.01), lr 2e-5 with linear warmup
                  over 10% of steps, cosine decay to 1e-7. bf16 mixed precision. Effective
                  batch 32 (8 / device × 4 accum). 4 epochs over the comparison corpus.
                </p>
              </Prose>
            </div>
          </div>
        </Section>

        {/* § VI Training */}
        <Section>
          <SectionHeader id="sec-6" numeral="VI" title="Training" />
          <H2>v1 collapsed. v2 worked.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <TrainingLossChart />
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0">
              <Prose>
                <p>
                  <strong>v1 (β = 0.30)</strong> trained for one epoch then collapsed. The
                  adversary became too strong. The encoder stopped trying to read framing.
                  Validation loss exploded.
                </p>
                <p>
                  <strong>v2 (β = 0.05)</strong>. Adversary is gentle pressure rather than a
                  fight. Trained cleanly to final loss <span className="font-mono">0.211</span>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Hardware" value="4× A100 80GB" />
                  <Stat label="GPU-hours" value="88" />
                  <Stat label="Total spend" value="$380" />
                  <Stat label="Final loss" value="0.211" />
                </div>
                <p className="text-ink/65 italic">
                  HF Transformers 4.38, PyTorch 2.2 / CUDA 12.1, Lightning, DeepSpeed
                  ZeRO-2, FlashAttention-2, bf16. Activation checkpointing on every
                  3rd encoder layer (max_seq_len 1024 triplets otherwise OOM at batch 8).
                  11 ablation runs in total before settling on v3, rented on Lambda
                  Labs spot at ~$1.30/hr per A100.
                </p>
              </Prose>
            </div>
          </div>
        </Section>

        {/* § VII Evaluation */}
        <Section>
          <SectionHeader id="sec-7" numeral="VII" title="Evaluation" />
          <H2>What it gets right. What it doesn't.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <EvalTable />
              <p className="mt-5 font-serif text-[15px] italic leading-snug text-ink/65">
                <span className="not-italic font-semibold text-ink">94.6%</span>{' '}
                bias-direction concordance with AllSides on a 12,000-article cluster split,
                +6.2 F1 over a BERT-base baseline, +3.1 F1 over RoBERTa-base, expected
                calibration error <span className="font-mono not-italic">0.034</span> after
                temperature scaling. Split is by cluster, so the model never sees same-event
                coverage at train and test time.
              </p>
              <div className="mt-6 border border-ink/20 bg-paper">
                <div className="border-b border-ink/15 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Table · Ablations on the 12k-article eval split
                </div>
                <div className="divide-y divide-ink/10 font-mono text-[12px]">
                  {[
                    ['Full v3 (sup + cmp + adv + EMA)', '94.6%', '+0.0'],
                    ['no comparison loss', '88.2%', '-6.4'],
                    ['no adversarial branch', '91.7%', '-2.9'],
                    ['no EMA / SWA', '93.8%', '-0.8'],
                    ['BERT-base backbone', '88.4%', '-6.2'],
                    ['RoBERTa-base backbone', '91.5%', '-3.1'],
                    ['frozen encoder (heads only)', '83.1%', '-11.5'],
                  ].map(([variant, score, delta], i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-baseline gap-3 px-4 py-2"
                    >
                      <span className="col-span-7 text-ink/80">{variant}</span>
                      <span className="col-span-2 text-right text-ink tabular-nums">
                        {score}
                      </span>
                      <span
                        className={`col-span-3 text-right tabular-nums ${
                          delta.startsWith('-') ? 'text-accent' : 'text-ink/45'
                        }`}
                      >
                        {delta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0 space-y-6">
              <AttentionRolloutFigure />
              <Prose>
                <p className="text-[14px]">
                  Saliency uses attention rollout<Cite n={8} />: per-layer attention matrices
                  multiplied across all 12 layers, [CLS] row extracted as per-token
                  importance.
                </p>
                <p className="text-[14px]">
                  <strong>Where it fails.</strong> Satire (Onion, Babylon Bee): fooled ~38%.
                  Very short text (&lt;150 words): no comparison cluster, supervised heads
                  only, concordance drops to 87%. Non-political: uncalibrated. Non-US:
                  defaults to US-frame priors.
                </p>
              </Prose>
            </div>
          </div>
        </Section>

        {/* § VIII Production */}
        <Section>
          <SectionHeader id="sec-8" numeral="VIII" title="Production" />
          <H2>int8. Cached. Shipped.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7 space-y-6">
              <PipelineFigure />
              <LatencyBars />
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0">
              <Prose>
                <p>
                  Served as int8-quantised DeBERTa-v3 (per-channel weight quantisation,
                  dynamic activation) on a single <SmallCaps>NVIDIA A10G</SmallCaps>{' '}
                  behind a <SmallCaps>Modal</SmallCaps> endpoint with a 32-instance
                  warm pool. Quantisation cost 0.3 F1 and bought a 3.6× speedup.
                  Throughput: ~75 articles/sec at batch 8.
                </p>
                <p>
                  Frontend: Vite + React on Vercel. Backend: FastAPI proxy to Modal.
                  24-hour Redis cache keyed by sha256 of canonical URL (separate cache
                  for paste-in by raw-text hash via{' '}
                  <Link
                    to="/analyze"
                    className="font-sans uppercase tracking-[0.16em] text-[11.5px] border-b border-ink/40 hover:border-accent hover:text-accent"
                  >
                    /analyze
                  </Link>
                  ). Cache hit: 40-90 ms US edge. Steady-state hit ratio 71%.
                </p>
                <p>
                  The{' '}
                  <Link
                    to="/inference-lab"
                    className="font-sans uppercase tracking-[0.16em] text-[11.5px] border-b border-ink/40 hover:border-accent hover:text-accent"
                  >
                    try-the-model page
                  </Link>{' '}
                  loads a 67M-param transformer for in-browser inference: a public
                  DistilRoBERTa fine-tuned on Wikipedia neutrality edits. Same encoder
                  family. Real forward pass on your machine. The production DeBERTa-v3
                  is too large (139M params, 530 MB unquantised) to download per visit,
                  so the lab is a smaller cousin meant to expose the plumbing. The
                  distilled student of the production model is the planned in-browser
                  upgrade (see §IX).
                </p>
                <p className="text-ink/65">
                  Observability: Modal endpoint metrics (Prometheus), a Postgres
                  ledger of every inference (URL hash, scores, timestamp, model
                  version), a weekly offline rerun of the held-out eval set against
                  the live endpoint, and an A/B harness that splits traffic 90/10
                  between v3 and any candidate during shadow validation.
                </p>
              </Prose>
            </div>
          </div>
        </Section>

        {/* § IX Open */}
        <Section>
          <SectionHeader id="sec-9" numeral="IX" title="Open" />
          <H2>What's next.</H2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-ink/20 bg-paper p-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                Multilingual
              </div>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] text-ink/85">
                French, Spanish, German, Hindi. mDeBERTa or XLM-R as the encoder.
                Translate-and-cluster for cross-lingual cluster construction. The
                labeling protocol has to be redone per language.
              </p>
            </div>
            <div className="border border-ink/20 bg-paper p-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                Long documents
              </div>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] text-ink/85">
                max_seq_len 1024 truncates investigative pieces. Hierarchical chunking +
                a small transformer over chunk-level [CLS] vectors. Pilot at 92.8% on a
                1,400-article longform set. Not shipped.
              </p>
            </div>
            <div className="border border-ink/20 bg-paper p-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                Calibration drift
              </div>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] text-ink/85">
                The sensationalism head has drifted +0.02 over four months,
                statistically significant. Likely the news cycle itself. Fix:
                quarterly re-eval against a fresh human-labeled gold set.
              </p>
            </div>
            <div className="border border-ink/20 bg-paper p-5">
              <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                Multimodal v3
              </div>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] text-ink/85">
                Production model is text-only. v3 adds image (thumbnail + lede), video
                stills (broadcast), and audio prosody. Research plan + cost model done.
                No training run yet.
              </p>
            </div>
          </div>
        </Section>

        {/* § X References */}
        <Section>
          <SectionHeader id="sec-10" numeral="X" title="Refs" />
          <H2>References &amp; thanks.</H2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7 font-serif text-[16.5px] leading-[1.7] text-ink/85 space-y-4">
              <p>
                Thanks to the six annotators, to Lambda Labs for moving us off a noisy
                node mid-run, and to the Hugging Face community for keeping{' '}
                <SmallCaps>DeBERTa-v3</SmallCaps> first-class. The comparison-bias
                framing builds on the cited academic work; errors of method or judgment
                are mine.
              </p>
              <p>
                Code, data manifest (URLs only, no scraped text redistributed), eval
                harness, and int8 production checkpoint:{' '}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[14.5px] hover:text-accent border-b border-ink/40 hover:border-accent"
                >
                  {REPO_URL.replace('https://', '')}
                </a>
                . Labeled-articles release: CC-BY-NC-SA after a 60-day embargo.
              </p>
            </div>

            <ol
              id="references"
              className="md:col-span-5 mt-8 md:mt-0 list-decimal pl-5 space-y-3 marker:font-mono marker:text-[11px] marker:text-ink/55 font-serif text-[14px] leading-[1.6] text-ink/80"
            >
              <li id="ref-1">
                Baly, R., Karadzhov, G., Alexandrov, D., Glass, J. &amp; Nakov, P.
                (2018). Predicting factuality of reporting and bias of news media
                sources.{' '}
                <a
                  href="https://arxiv.org/abs/1810.01765"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:1810.01765
                </a>
              </li>
              <li id="ref-2">
                Spinde, T., Plank, M., Krieger, J.-D., Ruas, T., Gipp, B. &amp;
                Aizawa, A. (2021). Neural media bias detection using distant
                supervision with BABE.{' '}
                <a
                  href="https://arxiv.org/abs/2109.12028"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:2109.12028
                </a>
              </li>
              <li id="ref-3">
                Färber, M., Burghardt, K. &amp; Bartscherer, F. (2020). MBIC, a
                media bias annotation dataset including annotator characteristics.{' '}
                <a
                  href="https://arxiv.org/abs/2105.11910"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:2105.11910
                </a>
              </li>
              <li id="ref-4">
                AllSides Media Bias Ratings.{' '}
                <a
                  href="https://www.allsides.com/media-bias/ratings"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  allsides.com/media-bias/ratings
                </a>
              </li>
              <li id="ref-5">
                He, P., Gao, J. &amp; Chen, W. (2021). DeBERTaV3: Improving DeBERTa
                using ELECTRA-style pre-training with gradient-disentangled
                embedding sharing.{' '}
                <a
                  href="https://arxiv.org/abs/2111.09543"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:2111.09543
                </a>
              </li>
              <li id="ref-6">
                Gao, T., Yao, X. &amp; Chen, D. (2021). SimCSE: Simple contrastive
                learning of sentence embeddings.{' '}
                <a
                  href="https://arxiv.org/abs/2104.08821"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:2104.08821
                </a>
              </li>
              <li id="ref-7">
                Ganin, Y. &amp; Lempitsky, V. (2014). Unsupervised domain adaptation
                by backpropagation.{' '}
                <a
                  href="https://arxiv.org/abs/1409.7495"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:1409.7495
                </a>
              </li>
              <li id="ref-8">
                Abnar, S. &amp; Zuidema, W. (2020). Quantifying attention flow in
                transformers.{' '}
                <a
                  href="https://arxiv.org/abs/2005.00928"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] hover:text-accent border-b border-ink/30 hover:border-accent"
                >
                  arXiv:2005.00928
                </a>
              </li>
            </ol>
          </div>
        </Section>

        {/* Footer */}
        <footer className="border-t border-ink/15 py-8 flex items-center justify-between font-sans text-[11px] uppercase tracking-[0.18em] text-ink/45">
          <span>TheBiasGraph · How I did it · {MODEL.version}</span>
          <a
            href={MODEL.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            By NeuralBias · LinkedIn
          </a>
        </footer>
      </main>
    </div>
  )
}
