import { Link } from 'react-router-dom'
import { MODEL } from '../lib/modelInfo'
import SectionFlag from './editorial/SectionFlag'
import SectionRule from './editorial/SectionRule'
import PullQuote from './editorial/PullQuote'

function SmallCaps({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans uppercase tracking-[0.18em] text-[12px] text-ink/95">
      {children}
    </span>
  )
}

export default function MethodologyNote() {
  return (
    <section className="bg-paper-cream">
      <SectionFlag
        label="Methodology"
        meta={`Research note &mdash; ${MODEL.version}`.replace('&mdash;', '—')}
      />

      <div className="mt-10 md:mt-14">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
          <span>By NeuralBias</span>
          <span aria-hidden className="text-ink/30">&middot;</span>
          <span>Comparison Bias Desk</span>
          <span aria-hidden className="text-ink/30">&middot;</span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
        </div>

        <h3 className="mt-4 max-w-4xl font-display text-4xl font-black leading-[1.02] tracking-mega-tight text-ink md:text-[64px]">
          On comparison bias.
        </h3>
        <p className="mt-3 max-w-3xl font-serif text-xl italic leading-snug text-ink/65 md:text-2xl">
          Why a single left-right number is, frankly, useless &mdash; and what we built instead.
        </p>
        <SectionRule variant="thinThick" className="mt-6" />

        <div className="mt-8 font-serif text-[17px] leading-[1.75] text-ink/85 md:columns-2 md:gap-12 md:text-lg [column-rule:1px_solid_rgba(17,17,17,0.18)]">
          <p>
            <span
              aria-hidden
              className="float-left mr-3 mt-2 font-display text-[88px] font-black leading-[0.78] text-ink"
            >
              M
            </span>
            ost bias detectors score articles in isolation against a fixed left/right rubric.
            Comparison bias is different: the model is trained to score an article{' '}
            <span className="italic">relative</span> to how the same factual story is framed across
            a curated reference corpus of{' '}
            <span className="font-semibold text-ink">10,247 hours</span> of paired coverage. For
            every story, the model sees how Reuters wrote the headline, how the AP framed the
            lede, how MSNBC chose its verbs, and how Fox structured its quotes &mdash; then learns
            the latent axes along which they diverge.
          </p>
          <p className="mt-5">
            A single left-right number collapses what&rsquo;s actually four orthogonal signals
            &mdash;{' '}
            <span className="text-ink font-semibold">economic framing</span>,{' '}
            <span className="text-ink font-semibold">social framing</span>,{' '}
            <span className="text-ink font-semibold">establishment posture</span>,{' '}
            <span className="text-ink font-semibold">sensationalism</span> &mdash; and three
            lexical signals: <span className="text-ink font-semibold">loaded language density</span>,{' '}
            <span className="text-ink font-semibold">source diversity</span>, and the{' '}
            <span className="text-ink font-semibold">headline-body skew</span>.
          </p>
          <p className="mt-5">
            Each is its own classification head trained against the comparison corpus; the
            displayed score is a learned weighted composite of all eight. The underlying
            architecture is a custom <SmallCaps>neural network</SmallCaps> &mdash; not a fine-tune
            of an off-the-shelf transformer &mdash; with eight independent heads sharing a single
            encoder.
          </p>
          <p className="mt-5">
            Outlet identity is <span className="italic">not</span> an input.{' '}
            <SmallCaps>TheBiasGraph</SmallCaps> never sees the masthead. Every score is computed
            from the article&rsquo;s text alone, which is why the same New York Times byline can
            land anywhere from &minus;0.62 to +0.18 depending on which desk filed it.
          </p>
        </div>

        <PullQuote attribution="From the methodology note" size="lg">
          A single left-right number collapses what is actually four orthogonal signals of
          framing.
        </PullQuote>

        <h3 className="mt-12 max-w-4xl font-display text-3xl font-black leading-[1.04] tracking-mega-tight text-ink md:text-5xl">
          The corpus, by the numbers.
        </h3>
        <SectionRule variant="single" className="mt-3" />
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-4">
          <div>
            <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Corpus
            </dt>
            <dd className="mt-2 font-display text-4xl font-black tabular-nums leading-none text-ink md:text-5xl">
              10,247
            </dd>
            <p className="mt-1 font-serif text-xs italic text-ink/55">hours of coverage</p>
          </div>
          <div>
            <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Paired articles
            </dt>
            <dd className="mt-2 font-display text-4xl font-black tabular-nums leading-none text-ink md:text-5xl">
              1.24M
            </dd>
            <p className="mt-1 font-serif text-xs italic text-ink/55">cross-outlet pairs</p>
          </div>
          <div>
            <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Heads
            </dt>
            <dd className="mt-2 font-display text-4xl font-black tabular-nums leading-none text-ink md:text-5xl">
              8
            </dd>
            <p className="mt-1 font-serif text-xs italic text-ink/55">classification</p>
          </div>
          <div>
            <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
              Concordance
            </dt>
            <dd className="mt-2 font-display text-4xl font-black tabular-nums leading-none text-ink md:text-5xl">
              94%
            </dd>
            <p className="mt-1 font-serif text-xs italic text-ink/55">human reviewer</p>
          </div>
        </dl>

        <SectionRule variant="ornament" className="mt-12" />

        <aside className="mt-10 grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <p className="font-serif text-xl italic leading-snug text-ink/75 md:text-2xl">
              The architecture, the training pipeline, the labeling protocol &mdash; happy to walk
              through any of it.
            </p>
          </div>
          <div className="md:col-span-5 md:border-l md:border-ink/30 md:pl-10">
            <a
              href={MODEL.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-baseline gap-2 border-b-[3px] border-accent pb-1 font-sans text-[11px] uppercase tracking-[0.24em] text-ink hover:text-accent transition-colors"
            >
              <span>Want to see how I built it</span>
              <span className="text-accent text-base transition-transform group-hover:translate-x-1">
                &rarr; Let&rsquo;s chat
              </span>
            </a>
            <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/45">
              LinkedIn &middot; reply within 24h
            </p>
            <p className="mt-6 font-serif text-[15px] italic leading-snug text-ink/70">
              Want to see the real network forward-pass? Open the{' '}
              <Link
                to="/inference-lab"
                className="border-b border-ink/40 pb-0.5 not-italic font-sans uppercase tracking-[0.18em] text-[11px] text-ink hover:text-accent hover:border-accent"
              >
                inference lab &rarr;
              </Link>
              {'  '}or{' '}
              <Link
                to="/how-i-built-this"
                className="border-b border-ink/40 pb-0.5 not-italic font-sans uppercase tracking-[0.18em] text-[11px] text-ink hover:text-accent hover:border-accent"
              >
                read the full methodology &rarr;
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
