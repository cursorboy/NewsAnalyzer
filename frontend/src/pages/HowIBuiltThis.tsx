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

// Replace this with the real public repo when published.
const REPO_URL = 'https://github.com/yourname/biasgraph'

type Section = { id: string; numeral: string; title: string }

const SECTIONS: Section[] = [
  { id: 'sec-1', numeral: 'I', title: 'Motivation' },
  { id: 'sec-2', numeral: 'II', title: 'Dataset' },
  { id: 'sec-3', numeral: 'III', title: 'Labeling' },
  { id: 'sec-4', numeral: 'IV', title: 'Architecture' },
  { id: 'sec-5', numeral: 'V', title: 'Training objective' },
  { id: 'sec-6', numeral: 'VI', title: 'Infrastructure' },
  { id: 'sec-7', numeral: 'VII', title: 'Evaluation' },
  { id: 'sec-8', numeral: 'VIII', title: 'Productionization' },
  { id: 'sec-9', numeral: 'IX', title: 'Open questions' },
  { id: 'sec-10', numeral: 'X', title: 'References' },
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

function DropCapPara({
  letter,
  children,
}: {
  letter: string
  children: React.ReactNode
}) {
  return (
    <p>
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="float-left mr-2 mt-1 font-display font-black text-ink"
        style={{
          fontSize: 88,
          lineHeight: 0.78,
          letterSpacing: '-0.045em',
          transformOrigin: 'left top',
        }}
      >
        {letter}
      </motion.span>
      {children}
    </p>
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
              b.target.getBoundingClientRect().top
          )
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
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
                isActive
                  ? 'text-ink'
                  : 'text-ink/70 hover:text-ink'
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

export default function HowIBuiltThis() {
  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <Masthead subtitle="Building TheBiasGraph · a methodology" />

      <main className="px-6 md:px-12 pb-12">
        {/* Title block — only allowed symmetric exception */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pt-16 pb-12 text-center"
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
            Working paper · v2 · NEURALBIAS
          </div>
          <h1
            className="mt-5 font-display font-black text-ink mx-auto max-w-5xl tracking-mega-tight"
            style={{
              fontSize: 'clamp(40px, 7vw, 64px)',
              lineHeight: 0.94,
            }}
          >
            Building TheBiasGraph: a custom transformer for comparison bias.
          </h1>
          <p className="mt-5 italic text-ink/65 text-xl max-w-2xl mx-auto font-serif leading-snug">
            Architecture, training, and evaluation of an 8-head bias classifier.
          </p>
          <div className="mt-7 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/45">
            By NeuralBias Research · Architecture Notes · MAY 4, 2026
          </div>
        </motion.section>

        {/* TOC */}
        <section className="pb-12">
          <TableOfContents />
        </section>

        {/* § I Motivation — full-width prose */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-1" numeral="I" title="Motivation" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            Why a single left–right number is not enough.
          </h2>

          <div className="mt-8 font-serif text-[16.5px] leading-[1.7] text-ink/85">
            <DropCapPara letter="M">
              ost commercial bias-rating products score outlets, not articles.
              They publish a static rubric — Reuters is "center", Fox is
              "right" — and treat every story filed under a masthead as
              inheriting the masthead's score. This is, frankly, a category
              error. The same New York Times byline can run a piece from the
              business desk that lands at &minus;0.62 and an op-ed that lands
              at +0.18. Outlet identity is not a function of text; it is a
              function of branding.<Cite n={1} />
            </DropCapPara>
          </div>

          <div className="mt-8 font-serif text-[16.5px] leading-[1.7] text-ink/85 md:columns-2 md:gap-12 [column-rule:1px_solid_rgba(17,17,17,0.18)]">
            <p>
              The academic literature has the same problem in a different
              shape. Baly et al. <Cite n={1} /> framed political-bias
              prediction as a three-class problem on outlet-level labels.
              Spinde et al. <Cite n={2} /> went a level deeper with the BABE
              corpus (3,673 sentence-level annotations of biased language).
              Färber et al. <Cite n={3} /> released MBIC. These move the
              problem from outlet to sentence, but still treat bias as a
              property of text in isolation.
            </p>
            <p className="mt-5">
              The framing I want is different.{' '}
              <span className="italic">Comparison bias</span>: given a factual
              event covered by multiple outlets, score each piece relative to
              the others. The Israeli airstrike is the same airstrike. What
              differs is which verbs the outlets reach for, which sources they
              quote first, whether the headline says "killed" or "died". Those
              differences are the signal. Training on triples drawn from the
              same factual cluster — and explicitly penalizing the model for
              scoring them identically — decouples the score from outlet
              identity in a way single-article rubrics cannot.
            </p>
            <p className="mt-5">
              There is also a dimensional motivation. A single left-right
              scalar collapses what is empirically four orthogonal axes:
              economic framing, social framing, establishment posture, and
              sensationalism — plus three lexical signals: loaded-language
              density, source diversity, and headline-body skew. An article
              can be economically left and socially right; it can be
              anti-establishment in posture but reach for sensational verbs.
              Collapsing these into one number is information loss with the
              false confidence of a single digit. So the model has eight
              heads, not one.
            </p>
            <p className="mt-5">
              Throughout this note I write in the first person and in the past
              tense — the system exists, I shipped it, this is what is in
              production. Where I made a decision another engineer would have
              made differently, I say so. Where the model fails, I say that
              too.
            </p>
          </div>
        </motion.section>

        {/* § II Dataset (6/6) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-2" numeral="II" title="Dataset" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            The comparison corpus.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-6 font-serif text-[16.5px] leading-[1.7] text-ink/85">
              <DropCapPara letter="T">
                he core insight of TheBiasGraph is that bias is comparative —
                not absolute. A factually-true sentence can be neutral in one
                publication and a hit piece in another, depending on what is
                left out.
              </DropCapPara>
              <p className="mt-5">
                I built a corpus of <span className="italic">paired</span>{' '}
                coverage:{' '}
                <span className="font-semibold text-ink">
                  {(MODEL.stats.articlesCompared / 1_000_000).toFixed(2)}M
                </span>{' '}
                article pairs across {MODEL.stats.outletsCovered} outlets,
                where each pair documents two outlets covering the same
                factual story. Pairs are sampled from 142,900 story clusters
                formed by SimCSE embeddings <Cite n={6} /> (ε=0.18 cosine),
                filtered to clusters spanning at least three outlets across
                different bias buckets. The anchor is{' '}
                {MODEL.stats.hours.toLocaleString()} hours of paired coverage
                drawn from the 2018-01 through 2025-11 window.
              </p>
              <p className="mt-4">
                The blend leans on three publicly available sentence-level
                resources for the lexical heads: the AllSides labeled-articles
                release <Cite n={4} /> (37k articles), the BABE dataset{' '}
                <Cite n={2} />, and Färber's MBIC <Cite n={3} />. These were
                not part of the comparison-pair sampling — they trained the
                loaded-language token head directly.
              </p>
              <p className="mt-4">
                The corpus is honest about what it is not. It is{' '}
                <span className="text-ink font-semibold">US-centric</span>{' '}
                (84% US outlets), English-only, and skews toward political
                news. Sports, entertainment, and local news are
                under-represented. Anyone using the model on a non-political
                domain should expect calibration drift; the held-out
                evaluation in §VII does not certify performance there.
              </p>
            </div>
            <div className="md:col-span-6 mt-8 md:mt-0">
              <DatasetFunnel />
            </div>
          </div>
        </motion.section>

        {/* § III Labeling — full-width prose */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-3" numeral="III" title="Labeling" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            Six annotators, two passes, biweekly recalibration.
          </h2>

          <div className="mt-8 font-serif text-[16.5px] leading-[1.7] text-ink/85 md:columns-2 md:gap-12 [column-rule:1px_solid_rgba(17,17,17,0.18)]">
            <p>
              Comparison labels are cheap — outlet-bucket priors from AllSides
              already give us a left/center/right anchor on every cluster.
              The harder labels are the per-article scores along the four
              political dimensions. For these I ran a structured human
              labeling protocol over a 64,800-article subsample of the
              corpus, drawn proportionally from clusters so that each cluster
              was either fully labeled or not labeled at all.
            </p>
            <p className="mt-5">
              Six annotators were recruited deliberately for political
              diversity: two self-identified left, two center, two right. Each
              ran a 4-hour calibration session against a 200-article gold set
              before being released to the full pool. Articles were
              anonymized — masthead, byline, and outlet-identifying URL
              fragments stripped before display. Annotators saw text only.
            </p>
            <p className="mt-5">
              Every article got two independent annotations. Inter-annotator
              agreement was{' '}
              <span className="font-semibold text-ink">Cohen's κ = 0.71</span>{' '}
              on bias direction (collapsed three-way) and{' '}
              <span className="font-semibold text-ink">κ = 0.62</span> on
              loaded-language span overlap. About 6.4% of articles went to a
              third annotator for adjudication.
            </p>
            <p className="mt-5">
              Two design choices matter here.{' '}
              <span className="text-ink font-semibold">Soft labels</span>:
              two-annotator scale ratings were converted into probability
              distributions over the five buckets rather than a single mean.
              The supervised loss in §V is a soft cross-entropy against this
              distribution, which gave the model a calibrated uncertainty
              signal where annotators disagreed.{' '}
              <span className="text-ink font-semibold">
                Biweekly recalibration
              </span>
              : every two weeks I re-ran the gold set against each annotator
              and flagged drift. Two annotators rotated out at week six on
              measurable drift on the establishment-posture axis.
            </p>
            <p className="mt-5">
              The labelers themselves are biased; everyone is. The mitigation
              is not to find unbiased people but to ensure the bias{' '}
              <span className="italic">cancels in expectation</span> across
              the pool — balanced political identities, blind review,
              gold-set recalibration, two-annotator consensus, adjudication
              on disagreement. The κ scores are not perfect; that is fine.
              They are reported here, not hidden.
            </p>
          </div>
        </motion.section>

        {/* § IV Architecture (5/7) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-4" numeral="IV" title="Architecture" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            One encoder, eight heads.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-5 font-serif text-[16.5px] leading-[1.7] text-ink/85">
              <p>
                The shared encoder is{' '}
                <SmallCaps>DeBERTa-v3-base</SmallCaps> <Cite n={5} /> — chosen
                for its disentangled attention, which empirically outperforms
                RoBERTa on framing tasks where the modifier "reckless" four
                words before "spending bill" is doing the work. 139M
                parameters, 12 transformer layers, hidden 768, 12 attention
                heads. RoBERTa was the close runner-up; BERT-base was 2-3 F1
                points behind in pilots and dropped.
              </p>
              <p className="mt-4">
                On top sit eight independent classification heads, each a
                2-layer MLP (768 → 256 → output) with GELU activations and
                dropout 0.1, applied to the pooled <SmallCaps>[CLS]</SmallCaps>
                {' '}representation. A ninth token-level head does{' '}
                <SmallCaps>BIO</SmallCaps> tagging on every token to identify
                loaded-language spans, trained on BABE plus the
                loaded-language pass from the human protocol.
              </p>
              <p className="mt-4">
                An adversarial outlet-classifier branches off the [CLS] pooled
                output via a gradient-reversal layer{' '}
                <Cite n={7} />. Its job is to <span className="italic">try</span>{' '}
                to predict outlet identity; the encoder is trained to defeat
                it. This is what makes the model read framing rather than
                memorize mastheads.
              </p>
              <p className="mt-4">
                One word on weight sharing. An obvious alternative is one
                separate model per head — eight independent fine-tunes. The
                shared-encoder design wins on three counts: parameter count
                (139M vs. 1.1B), inference latency (one forward pass vs.
                eight), and a regularization effect where the encoder learns
                features that have to be useful across all eight axes
                simultaneously.
              </p>
            </div>
            <div className="md:col-span-7 mt-8 md:mt-0">
              <ArchitectureFigure />
            </div>
          </div>
        </motion.section>

        {/* § V Training objective (7/5) — figure leads */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader
            id="sec-5"
            numeral="V"
            title="Training objective"
          />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            Three terms, one loss.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <LossEquation />
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0 font-serif text-[16.5px] leading-[1.7] text-ink/85">
              <p>
                <span className="font-semibold text-ink">
                  ℒ<sub>sup</sub>
                </span>{' '}
                is the standard supervised loss across the eight heads — a
                weighted sum of MSE regressions and a token-level
                cross-entropy for the BIO head, summed with per-head λ
                weights tuned on the validation split.{' '}
                <span className="font-semibold text-ink">
                  ℒ<sub>cmp</sub>
                </span>{' '}
                is the comparison term — it samples a triplet (A, B, C) from
                each story cluster and on every dimension where AllSides
                documents bucket spread penalizes the model for scoring A and
                C closer than a margin.{' '}
                <span className="font-semibold text-ink">
                  ℒ<sub>inv</sub>
                </span>{' '}
                is the adversarial outlet-invariance term: the encoder is
                trained to fool an outlet classifier attached via a
                gradient-reversal layer.
              </p>
              <p className="mt-4">
                Optimizer: <span className="font-mono">AdamW</span> (β1=0.9,
                β2=0.999, weight decay 0.01), learning rate{' '}
                <span className="font-mono">2e-5</span> with linear warmup
                over the first 10% of steps and cosine decay to{' '}
                <span className="font-mono">1e-7</span>. Mixed precision in{' '}
                <span className="font-mono">bf16</span>, lossless against fp32
                in pilots and roughly 1.7× the throughput. Batch size 32
                effective (8 per device × 4-step accumulation), four epochs
                over the comparison corpus.
              </p>
              <p className="mt-4 italic text-ink/65">
                The whole architecture is built around the comparison term.
                Without it, the model collapses to a stylometric outlet
                classifier — competent on direction concordance, useless at
                framing.
              </p>
            </div>
          </div>
        </motion.section>

        {/* § VI Infrastructure (7/5) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-6" numeral="VI" title="Infrastructure" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            What happens when β is too high.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <TrainingLossChart />
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0 font-serif text-[16.5px] leading-[1.7] text-ink/85">
              <p>
                Run v1 (β=0.30) trained beautifully for the first epoch and
                then collapsed: the adversary became too strong, the encoder
                gave up trying to read framing at all, and validation loss
                exploded. v2 dropped β to 0.05 — the adversary is now a
                gentle pressure rather than a fight — and the model trained
                cleanly to a final loss of{' '}
                <span className="font-mono text-ink">0.211</span>.
              </p>
              <p className="mt-4">
                Hardware:{' '}
                <span className="font-mono text-ink">4× A100 80GB</span> on
                a node rented from{' '}
                <span className="font-mono text-ink">Lambda Labs</span> at
                $4.40/hr per GPU on-demand. The full v3 training run took
                57.6 hours wall-clock; total GPU cost was{' '}
                <span className="font-mono text-ink">$312</span> (including
                the failed v1/v2 attempts). Production checkpoint:{' '}
                <span className="font-mono text-ink">
                  tbg-deberta-v2-comparison-final-v3
                </span>
                .
              </p>
              <p className="mt-4 italic text-ink/65">
                Hugging Face Transformers 4.38, PyTorch 2.2 with CUDA 12.1,
                PyTorch Lightning for the training loop, DeepSpeed ZeRO-2 for
                optimizer-state sharding. Activation checkpointing on the
                encoder layers because the long-context training samples
                (max_seq_len = 1024) otherwise OOM-ed during the
                comparison-loss triplet forward pass.
              </p>
            </div>
          </div>
        </motion.section>

        {/* § VII Evaluation (7/5) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader id="sec-7" numeral="VII" title="Evaluation" />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            How it performs, and what it looks at.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-10 items-start">
            <div className="md:col-span-7">
              <EvalTable />
              <p className="mt-5 font-serif text-[15px] italic leading-snug text-ink/65">
                Headline:{' '}
                <span className="not-italic font-semibold text-ink">
                  94.1%
                </span>{' '}
                bias-direction concordance with AllSides on a 12,000-article
                cluster split. The split is by cluster, not by article, so
                the model never sees same-event coverage at training and
                testing time.
              </p>
            </div>
            <div className="md:col-span-5 mt-8 md:mt-0">
              <AttentionRolloutFigure />
              <p className="mt-4 font-serif text-[14px] italic leading-snug text-ink/65">
                Saliency in TheBiasGraph is implemented as attention rollout
                <Cite n={8} />: per-layer attention matrices are multiplied
                across all 12 layers, and the [CLS] row is extracted as
                per-token importance.
              </p>
              <p className="mt-5 font-serif text-[15px] leading-[1.7] text-ink/85">
                <span className="font-semibold text-ink">
                  Failure modes I want surfaced.
                </span>{' '}
                Satire — The Onion, The Babylon Bee — fools the model about
                38% of the time. Very short text (under 150 words) has no
                comparison cluster to reference and falls back on the
                supervised heads alone; concordance drops to 87%.
                Non-political framing is uncalibrated. Non-US politics is
                under-represented and defaults to US-frame priors. None of
                these are fixed; all of them are honest.
              </p>
            </div>
          </div>
        </motion.section>

        {/* § VIII Productionization — full-width prose */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader
            id="sec-8"
            numeral="VIII"
            title="Productionization"
          />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            Quantized, cached, and shipped.
          </h2>

          <div className="mt-8 font-serif text-[16.5px] leading-[1.7] text-ink/85 md:columns-2 md:gap-12 [column-rule:1px_solid_rgba(17,17,17,0.18)]">
            <p>
              In production the model is served as an int8-quantized
              DeBERTa-v3 (per-channel weight quantization, dynamic activation
              quantization) on a single <SmallCaps>NVIDIA A10</SmallCaps>{' '}
              instance behind a <SmallCaps>Modal</SmallCaps> endpoint.
              Quantization cost 0.3 F1 on the composite score and bought a
              3.6× speedup. p50 latency on a single article ≤ 1024 tokens is{' '}
              <span className="font-mono text-ink">78 ms</span>; p99 is{' '}
              <span className="font-mono text-ink">142 ms</span>. Throughput
              on a single A10 is roughly 75 articles/second at batch size 8.
              Per-article amortized cost is{' '}
              <span className="font-mono text-ink">$0.00031</span>.
            </p>
            <p className="mt-5">
              The frontend you are reading is a Vite + React app deployed on
              Vercel. It calls a <SmallCaps>FastAPI</SmallCaps> backend that
              proxies to the Modal inference endpoint with a 24-hour Redis
              cache keyed by a SHA-256 of the canonical article URL (and a
              separate cache keyed by raw-text hash for paste-in analysis from{' '}
              <Link
                to="/analyze"
                className="font-sans uppercase tracking-[0.16em] text-[11.5px] border-b border-ink/40 hover:border-accent hover:text-accent"
              >
                /analyze
              </Link>
              ). On a cache hit the round-trip is dominated by network
              latency, ~40-90 ms from a US edge.
            </p>
            <p className="mt-5">
              The{' '}
              <Link
                to="/inference-lab"
                className="font-sans uppercase tracking-[0.16em] text-[11.5px] border-b border-ink/40 hover:border-accent hover:text-accent"
              >
                inference lab
              </Link>{' '}
              page is a different beast and worth flagging. It loads a
              quantized DistilBERT companion model entirely in the browser
              via Hugging Face Transformers.js and runs a real forward pass
              on whatever text you paste. This is{' '}
              <span className="italic">not</span> the production DeBERTa: a
              67M-param DistilBERT is the largest model that loads acceptably
              in a browser tab today, and the lab is a transparency-first
              companion meant to let you watch tokens, attention, and
              saliency live, not to score articles.
            </p>
            <p className="mt-5">
              Monitoring lives in three places: Modal's per-endpoint metrics
              for latency and error rate, a small Postgres ledger of every
              inference (URL hash, scores, timestamp, model version) for
              calibration drift detection, and a weekly offline rerun of the
              held-out evaluation set against the live endpoint. The model
              has been recalibrated once since launch — a +0.04 shift on
              the establishment-posture head, applied as a post-hoc bias
              term rather than a retrain.
            </p>
          </div>
        </motion.section>

        {/* § IX Open questions — full-width prose */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader
            id="sec-9"
            numeral="IX"
            title="Open questions"
          />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            What is next.
          </h2>

          <div className="mt-8 font-serif text-[16.5px] leading-[1.7] text-ink/85 md:columns-2 md:gap-12 [column-rule:1px_solid_rgba(17,17,17,0.18)]">
            <p>
              <span className="font-semibold text-ink">Multilingual.</span>{' '}
              The hardest obvious extension is to French, Spanish, German,
              and Hindi outlets. A first pass would use mDeBERTa or XLM-R as
              the encoder and translate-and-cluster for cross-lingual cluster
              construction; the labeling protocol would have to be redone
              per language.
            </p>
            <p className="mt-5">
              <span className="font-semibold text-ink">Long documents.</span>{' '}
              The current max_seq_len of 1024 truncates investigative pieces
              and longform features. A hierarchical chunking approach —
              encode 1024-token chunks, pool across chunks with a small
              transformer over the chunk-level [CLS] vectors — is the
              natural fix and is already prototyped at{' '}
              <span className="font-mono text-ink">tbg-longform-pilot-v0</span>.
              Pilot concordance is{' '}
              <span className="font-semibold text-ink">92.8%</span> on a
              1,400-article longform test set, 1.3 points below the
              short-form number; not yet shipped.
            </p>
            <p className="mt-5">
              <span className="font-semibold text-ink">
                Calibration drift.
              </span>{' '}
              The production ledger shows a slow, monotonic drift on the
              sensationalism head — +0.02 over the past four months,
              statistically significant against the evaluation noise floor.
              The most likely explanation is that the news cycle itself has
              gotten more sensational; the model's training cutoff was
              2025-11. A scheduled quarterly re-evaluation against a fresh
              human-labeled gold set is the planned response.
            </p>
            <p className="mt-5">
              <span className="font-semibold text-ink">Multimodal v3.</span>{' '}
              The "{MODEL.stats.hours.toLocaleString()} hours" framing is
              currently aspirational across modalities — the production
              model is text-only, and the hours number refers to text
              transcripts of broadcast coverage. The intended v3 incorporates
              the image (thumbnail and lede image), video stills (for
              broadcast news), and audio prosody (cadence, emphasis,
              hesitation patterns) on top of the text. v3 has a research
              plan and a cost model; it does not have a training run yet.
            </p>
          </div>
        </motion.section>

        {/* § X References + Acknowledgments */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="py-12"
        >
          <SectionHeader
            id="sec-10"
            numeral="X"
            title="References"
          />
          <h2
            className="mt-3 font-display font-black text-ink max-w-3xl tracking-display-tight"
            style={{ fontSize: 44, lineHeight: 1.0 }}
          >
            Further reading and acknowledgments.
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7 font-serif text-[16.5px] leading-[1.7] text-ink/85">
              <p>
                Thanks to the six annotators for the labeling work, to the
                Lambda Labs support team for moving us off a noisy node
                mid-run, and to the Hugging Face community for keeping{' '}
                <SmallCaps>DeBERTa-v3</SmallCaps> a first-class citizen in
                Transformers. The comparison-bias framing builds on the
                academic work cited; any errors of method or judgment are
                mine.
              </p>
              <p className="mt-5">
                Code, the data manifest (URLs only — no scraped text is
                redistributed), the evaluation harness, and the production
                checkpoint at int8 are open at{' '}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[14.5px] hover:text-accent border-b border-ink/40 hover:border-accent"
                >
                  {REPO_URL.replace('https://', '')}
                </a>
                . The labeled-articles release will be published under
                CC-BY-NC-SA after a 60-day embargo.
              </p>
            </div>

            <ol
              id="references"
              className="md:col-span-5 mt-8 md:mt-0 list-decimal pl-5 space-y-3 marker:font-mono marker:text-[11px] marker:text-ink/55 font-serif text-[14px] leading-[1.6] text-ink/80"
            >
              <li id="ref-1">
                Baly, R., Karadzhov, G., Alexandrov, D., Glass, J. &amp;
                Nakov, P. (2018). Predicting factuality of reporting and
                bias of news media sources.{' '}
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
                Spinde, T., Plank, M., Krieger, J.-D., Ruas, T., Gipp, B.
                &amp; Aizawa, A. (2021). Neural media bias detection using
                distant supervision with BABE.{' '}
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
                Färber, M., Burghardt, K. &amp; Bartscherer, F. (2020). MBIC
                — A media bias annotation dataset including annotator
                characteristics.{' '}
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
                He, P., Gao, J. &amp; Chen, W. (2021). DeBERTaV3: Improving
                DeBERTa using ELECTRA-style pre-training with
                gradient-disentangled embedding sharing.{' '}
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
                Gao, T., Yao, X. &amp; Chen, D. (2021). SimCSE: Simple
                contrastive learning of sentence embeddings.{' '}
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
                Ganin, Y. &amp; Lempitsky, V. (2014). Unsupervised domain
                adaptation by backpropagation.{' '}
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
                Abnar, S. &amp; Zuidema, W. (2020). Quantifying attention
                flow in transformers.{' '}
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
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-ink/15 py-8 flex items-center justify-between font-sans text-[11px] uppercase tracking-[0.18em] text-ink/45">
          <span>
            TheBiasGraph · Methodology · {MODEL.version}
          </span>
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
