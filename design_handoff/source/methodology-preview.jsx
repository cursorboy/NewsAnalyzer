/* Methodology preview — a representative slice of /how-i-built-this
   so you can see the diagram language in context. */

function MethodologyPreview() {
  return (
    <div className="bg-paper-cream text-ink" style={{ width: 1280, fontFamily: '"Source Serif 4", Georgia, serif' }}>
      {/* Masthead */}
      <header>
        <div className="border-t-[2px] border-ink" />
        <div className="px-12 pt-8 pb-5 flex items-baseline justify-between">
          <span className="font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, letterSpacing: '-0.04em' }}>TheBiasGraph</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>Building TheBiasGraph · a methodology</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/45" style={{ fontFamily: 'Inter' }}>v2 · 11 min read</span>
        </div>
        <div className="border-b border-ink/20" />
      </header>

      {/* Title */}
      <section className="px-12 pt-20 pb-12 text-center">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>Research Note · No. 1</div>
        <h1 className="mt-5 font-display font-black text-ink mx-auto max-w-4xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.045em' }}>
          A custom transformer for comparison bias.
        </h1>
        <p className="mt-5 italic text-ink/65 text-xl max-w-2xl mx-auto">
          How I built TheBiasGraph alone over eighteen months — model, dataset, evaluation, infrastructure.
        </p>
        <div className="mt-7 text-[11px] uppercase tracking-[0.22em] text-ink/45" style={{ fontFamily: 'Inter' }}>By NeuralBias · May 2026 · 11 min read</div>
      </section>

      {/* TOC */}
      <section className="px-12 pb-12">
        <div className="grid grid-cols-12 gap-10 border-t border-b border-ink/15 py-6 text-[12px]" style={{ fontFamily: 'Inter' }}>
          {[
            'I · Motivation', 'II · Dataset', 'III · Labeling', 'IV · Architecture',
            'V · Training objective', 'VI · Infrastructure', 'VII · Evaluation', 'VIII · Production',
          ].map((s, i) => (
            <a key={i} className="col-span-3 flex items-baseline gap-2 text-ink/70 hover:text-ink">
              <span className="tabular-nums text-ink/35 w-6">0{i+1}</span>
              <span>{s.replace(/^[IVX]+ · /, '')}</span>
            </a>
          ))}
        </div>
      </section>

      {/* § II Dataset */}
      <section className="px-12 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ II · Dataset</div>
        <h2 className="mt-3 font-display font-black text-ink max-w-2xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          The comparison corpus.
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-10">
          <div className="text-[16px] leading-[1.65] text-ink/85 columns-1">
            <p>
              <span className="float-left mr-2 mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 56, lineHeight: 0.78 }}>T</span>
              he core insight of TheBiasGraph is that bias is comparative — not absolute. A factually-true sentence can be neutral in one publication and a hit piece in another, depending on what is left out.
            </p>
            <p className="mt-4">
              I built a corpus of <span className="italic">paired</span> coverage: 1.24M article pairs across 312 outlets, where each pair documents two outlets covering the same factual story. Pairs are sampled from 142,900 story clusters formed by SimCSE embeddings (ε=0.18 cosine), filtered to clusters spanning at least three outlets in different bias buckets.
            </p>
          </div>
          <DatasetFunnel />
        </div>
      </section>

      {/* § IV Architecture */}
      <section className="border-t border-ink/15 px-12 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ IV · Architecture</div>
        <h2 className="mt-3 font-display font-black text-ink max-w-2xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          One encoder, eight heads.
        </h2>

        <div className="mt-8 grid grid-cols-12 gap-10 items-start">
          <div className="col-span-5 text-[16px] leading-[1.65] text-ink/85">
            <p>
              The shared encoder is DeBERTa-v3-base — chosen for its disentangled attention, which empirically outperforms RoBERTa on framing tasks. On top sit eight independent classification heads, each a 2-layer MLP with a dimension-specific output range and loss weight.
            </p>
            <p className="mt-4">
              An adversarial outlet-classifier branches off the [CLS] pooled output via a gradient-reversal layer (Ganin et al., 2015). Its job is to <span className="italic">try</span> to predict outlet identity; the encoder is trained to defeat it. This is what makes the model read framing rather than memorize mastheads.
            </p>
          </div>
          <div className="col-span-7">
            <ArchitectureFigure />
          </div>
        </div>
      </section>

      {/* § V Training objective */}
      <section className="border-t border-ink/15 px-12 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ V · Training objective</div>
        <h2 className="mt-3 font-display font-black text-ink max-w-2xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          Three terms, one loss.
        </h2>

        <div className="mt-8 grid grid-cols-12 gap-10 items-start">
          <div className="col-span-7">
            <LossEquation />
          </div>
          <div className="col-span-5 text-[16px] leading-[1.65] text-ink/85">
            <p>
              <span className="font-semibold text-ink">ℒ<sub>sup</sub></span> is the standard supervised loss across the eight heads.{' '}
              <span className="font-semibold text-ink">ℒ<sub>cmp</sub></span> is the comparison term — it penalizes the model for assigning identical scores to two articles inside the same story cluster, scaled by their documented difference. <span className="font-semibold text-ink">ℒ<sub>inv</sub></span> is the adversarial outlet-invariance term.
            </p>
            <p className="mt-4 italic text-ink/65">
              The whole architecture is built around the comparison term. Without it, the model collapses to a stylometric outlet classifier.
            </p>
          </div>
        </div>
      </section>

      {/* § VI Training */}
      <section className="border-t border-ink/15 px-12 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ VI · Infrastructure</div>
        <h2 className="mt-3 font-display font-black text-ink max-w-2xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          What happens when β is too high.
        </h2>
        <div className="mt-8 grid grid-cols-12 gap-10 items-start">
          <div className="col-span-7">
            <TrainingLossChart />
          </div>
          <div className="col-span-5 text-[15px] leading-[1.65] text-ink/85">
            <p>
              Run v1 (β=0.30) trained beautifully for the first epoch and then collapsed: the adversary became too strong, the encoder gave up trying to read framing at all, and validation loss exploded. v2 dropped β to 0.05 — the adversary is now a gentle pressure rather than a fight — and the model trained cleanly to a final loss of 0.211.
            </p>
            <p className="mt-4 text-ink/65 italic">
              4× A100 80GB · Lambda Labs · $4.40/hr · 58hrs · $312 total · run name <span className="not-italic" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>tbg-deberta-v2-comparison-final-v3</span>
            </p>
          </div>
        </div>
      </section>

      {/* § VII Eval + saliency */}
      <section className="border-t border-ink/15 px-12 py-12">
        <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ VII · Evaluation</div>
        <h2 className="mt-3 font-display font-black text-ink max-w-2xl" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
          How it performs, and what it looks at.
        </h2>
        <div className="mt-8 grid grid-cols-12 gap-10">
          <div className="col-span-7">
            <EvalTable />
          </div>
          <div className="col-span-5">
            <AttentionRolloutFigure />
            <p className="mt-4 text-[14px] text-ink/65 italic leading-snug">
              Saliency in TheBiasGraph is implemented as attention rollout: the per-layer attention matrices are multiplied across all 12 layers, and the [CLS] row is extracted as per-token importance.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/15 px-12 py-8 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink/45" style={{ fontFamily: 'Inter' }}>
        <span>TheBiasGraph · Research Note No. 1</span>
        <span>References · arXiv 1810.01765, 2109.12028, 2111.09543, 2104.08821, 1409.7495, 2005.00928</span>
      </footer>
    </div>
  );
}

window.MethodologyPreview = MethodologyPreview;
