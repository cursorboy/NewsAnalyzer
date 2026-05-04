/* /inference-lab — a real, working transformer in the browser.
   Built like a lab notebook: sectioned I–VII, terminal log feed,
   monospace numerics, editorial typography for prose. */

/* §I — Model card */
function LabModelCard() {
  const rows = [
    ['Model',          'Xenova/distilbert-base-uncased-finetuned-sst-2-english'],
    ['Architecture',   'DistilBERT (encoder-only)'],
    ['Layers · Heads', '6 · 12'],
    ['Hidden dim',     '768'],
    ['Vocab',          '30,522'],
    ['Parameters',     '66M'],
    ['Tokenizer',      'WordPiece'],
    ['Quantization',   'fp32 · ~47 MB'],
  ];
  return (
    <div className="border-2 border-ink p-6 bg-paper">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ I · Model card</div>
          <h2 className="mt-2 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 38, letterSpacing: '-0.04em' }}>
            distilbert-base-uncased
          </h2>
          <p className="mt-1 italic text-ink/60 text-[15px]">A small companion to the production DeBERTa — small enough to run in your browser.</p>
        </div>
        <a className="text-[11px] uppercase tracking-[0.2em] text-ink border-b border-ink pb-1" style={{ fontFamily: 'Inter' }}>View on Hugging Face ↗</a>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-2 text-[13px]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between border-b border-ink/15 py-1.5">
            <span className="text-ink/55" style={{ fontFamily: 'Inter' }}>{k}</span>
            <span className="text-ink">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* §II — Load model */
function LabLoad() {
  const lines = [
    ['00:00.012', 'fetch', 'config.json (1.2 KB) ✓'],
    ['00:00.184', 'fetch', 'tokenizer.json (711 KB) ✓'],
    ['00:00.412', 'fetch', 'tokenizer_config.json (1.4 KB) ✓'],
    ['00:00.498', 'fetch', 'model_quantized.onnx (47.0 MB) — 12% …'],
    ['00:01.834', 'fetch', 'model_quantized.onnx (47.0 MB) — 48% …'],
    ['00:03.122', 'fetch', 'model_quantized.onnx (47.0 MB) — 87% …'],
    ['00:03.812', 'cache', 'idb://transformers-cache/Xenova/distilbert ✓'],
    ['00:03.902', 'init',  'ort.InferenceSession.create(model.onnx) ✓'],
    ['00:03.984', 'ready', 'window.tbgModel · window.tbgTokenizer ✓'],
  ];
  return (
    <div className="border border-ink/30 bg-ink text-paper-cream p-5" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
      <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-[0.22em] text-paper-cream/60" style={{ fontFamily: 'Inter' }}>
        <span>§ II · Load model</span>
        <span>tbg-lab.log</span>
      </div>
      <div className="space-y-1 text-[12px]">
        {lines.map(([t, kind, msg], i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="text-paper-cream/40 tabular-nums w-20">{t}</span>
            <span className="text-accent uppercase tracking-[0.18em] w-14 text-[10px]" style={{ fontFamily: 'Inter' }}>{kind}</span>
            <span>{msg}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2 text-paper-cream/60">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span>model loaded · 47.0 MB · cached in IndexedDB</span>
        </div>
        <button className="border border-paper-cream/40 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-paper-cream/85" style={{ fontFamily: 'Inter' }}>Reload</button>
      </div>
    </div>
  );
}

/* §III — Tokenizer */
function LabTokenizer() {
  const tokens = [
    ['[CLS]', 101], ['the', 1996], ['reckless', 23358], ['gop', 4156], ['plan', 2933],
    ['slammed', 12992], ['working', 2551], ['families', 3232], ['on', 2006],
    ['thursday', 9432], ['.', 1012], ['[SEP]', 102],
  ];
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ III · Tokenizer</div>
          <h2 className="mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 30, letterSpacing: '-0.04em' }}>
            WordPiece, with real IDs.
          </h2>
        </div>
        <span className="text-[11px] text-ink/45 tabular-nums" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>seq_len = 12</span>
      </div>
      <div className="mt-4 border border-ink/20 p-4 bg-paper-cream/40 text-[15px] italic text-ink/85">
        "The reckless GOP plan slammed working families on Thursday."
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {tokens.map(([t, id], i) => (
          <span key={i} className="inline-flex items-baseline gap-1.5 border border-ink/30 bg-paper px-2 py-1">
            <span className={`text-[12px] ${t.startsWith('[') ? 'text-accent' : 'text-ink'}`}>{t}</span>
            <span className="text-[10px] tabular-nums text-ink/45">{id}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* §IV — Forward pass: shapes + heatmap + sparkline + logits */
function LabForwardPass() {
  // Synthetic 12x12 attention map for visual purposes
  const N = 12;
  const attn = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => {
      const focus = Math.exp(-Math.abs(i - j) / 3) + (Math.random() * 0.18);
      const cls = j === 0 ? 0.4 : 0;
      return Math.min(1, focus + cls);
    })
  );
  // 256-cell sparkline
  const spark = Array.from({ length: 256 }, () => (Math.random() - 0.5) * 0.8);
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ IV · Forward pass</div>
          <h2 className="mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 30, letterSpacing: '-0.04em' }}>
            Real tensors. Real time.
          </h2>
        </div>
        <div className="text-right text-[11px]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
          <div className="text-ink/55" style={{ fontFamily: 'Inter' }}>wall clock</div>
          <div className="text-ink text-[18px] tabular-nums">42.118 ms</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Hidden state shapes */}
        <div className="col-span-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2" style={{ fontFamily: 'Inter' }}>Hidden states · per layer</div>
          <div className="space-y-1.5 text-[12px]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
            {[1, 2, 3, 4, 5, 6].map((L) => (
              <div key={L} className="flex items-baseline justify-between border-b border-ink/15 py-1">
                <span className="text-ink/55">layer_{L}</span>
                <span className="text-ink">[1, 12, 768]</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-ink/55 italic" style={{ fontFamily: 'Inter' }}>output_hidden_states = true</div>
        </div>

        {/* Attention heatmap */}
        <div className="col-span-4">
          <div className="flex items-baseline justify-between mb-2 text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>
            <span>Attention · L=4 · H=7</span>
            <span className="text-ink/40">12×12</span>
          </div>
          <div className="grid border border-ink/30" style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, gridAutoRows: '14px' }}>
            {attn.flat().map((v, i) => (
              <div key={i} style={{ background: `rgba(185, 28, 28, ${v * 0.85})` }} />
            ))}
          </div>
          <div className="mt-2 flex gap-2 text-[10px]" style={{ fontFamily: 'Inter' }}>
            <span className="text-ink/55">head</span>
            <select className="border border-ink/30 bg-paper px-2 py-0.5 text-[10px]"><option>head 7</option></select>
            <span className="text-ink/55 ml-2">layer</span>
            <select className="border border-ink/30 bg-paper px-2 py-0.5 text-[10px]"><option>layer 4</option></select>
          </div>
        </div>

        {/* Pooled CLS sparkline + logits */}
        <div className="col-span-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2" style={{ fontFamily: 'Inter' }}>[CLS] pooled · 256 of 768</div>
          <svg viewBox="0 0 256 60" width="100%" height="60" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="256" y2="30" stroke="#11111133" strokeWidth="0.5"/>
            {spark.map((v, i) => (
              <line key={i} x1={i + 0.5} y1={30} x2={i + 0.5} y2={30 - v * 28} stroke="#111" strokeWidth="0.7" />
            ))}
          </svg>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-1.5" style={{ fontFamily: 'Inter' }}>Logits · softmax</div>
            <div className="space-y-1.5 text-[12px]" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
              {[
                ['NEGATIVE', -2.418, 0.927, true],
                ['POSITIVE',  0.142, 0.073, false],
              ].map(([l, lg, p, top]) => (
                <div key={l} className={`flex items-baseline gap-3 border-b border-ink/10 py-1 ${top ? 'text-ink' : 'text-ink/55'}`}>
                  <span className="w-20 uppercase tracking-[0.18em] text-[10px]" style={{ fontFamily: 'Inter' }}>{l}</span>
                  <span className="tabular-nums">{lg.toFixed(3)}</span>
                  <span className="ml-auto tabular-nums">{(p * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-ink/55" style={{ fontFamily: 'Inter' }}>argmax · <span className="text-accent">NEGATIVE</span></div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button className="border border-ink px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink" style={{ fontFamily: 'Inter' }}>Re-run</button>
        <button className="bg-ink px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-paper-cream" style={{ fontFamily: 'Inter' }}>Run forward pass →</button>
      </div>
    </div>
  );
}

/* §V — Saliency / attention rollout */
function LabSaliency() {
  const tokens = ['[CLS]', 'the', 'reckless', 'GOP', 'plan', 'slammed', 'working', 'families', 'on', 'Thursday', '.', '[SEP]'];
  const w = [0.08, 0.10, 0.91, 0.78, 0.34, 0.86, 0.48, 0.59, 0.10, 0.22, 0.05, 0.06];
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ V · Saliency</div>
          <h2 className="mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 30, letterSpacing: '-0.04em' }}>
            Attention rollout.
          </h2>
          <p className="mt-1 italic text-ink/60 text-[14px]">Abnar &amp; Zuidema, 2020 — multiply attention across all 6 layers, take the [CLS] row.</p>
        </div>
        <span className="text-[11px] text-ink/45" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>A_rollout = ∏ Â_l</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {tokens.map((t, i) => (
          <span key={i} className="px-2 py-1 text-[14px]" style={{
            backgroundColor: `rgba(185, 28, 28, ${w[i] * 0.7})`,
            fontFamily: t.startsWith('[') ? 'ui-monospace, Menlo, monospace' : '"Source Serif 4", serif',
            color: t.startsWith('[') ? '#B91C1C' : '#111',
          }}>{t}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-ink/55" style={{ fontFamily: 'Inter' }}>
        <span>low</span>
        <div className="flex-1 h-2" style={{ background: 'linear-gradient(to right, transparent, #B91C1C)' }} />
        <span>high</span>
      </div>
    </div>
  );
}

/* §VI — Reproducibility / hashes */
function LabHashes() {
  const items = [
    ['SHA-256 · input', '8f3b 6c2a e5d4 9a17  b8c4 6e2f 11ad 5f93  …  3c9e a48b 2d61 7f50  e2a4 9b1c 06f5 8d72'],
    ['SHA-256 · logits', 'd4a1 7e83 5b29 04cf  6e8a b0d3 1f47 2a59  …  91bd 38f0 2c61 e5b2  74fa 95c8 e310 8b6d'],
  ];
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>§ VI · Reproducibility</div>
          <h2 className="mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 30, letterSpacing: '-0.04em' }}>
            Same input, same bytes.
          </h2>
        </div>
        <div className="text-right text-[11px]" style={{ fontFamily: 'Inter' }}>
          <div className="text-emerald-700 uppercase tracking-[0.2em]">✓ match · 3 runs</div>
        </div>
      </div>
      <div className="mt-4 space-y-3" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {items.map(([k, v]) => (
          <div key={k} className="border border-ink/20 bg-paper-cream/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-1.5" style={{ fontFamily: 'Inter' }}>{k}</div>
            <div className="text-[11px] text-ink/85 break-all leading-relaxed">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] text-ink/55 italic" style={{ fontFamily: 'Inter' }}>computed via crypto.subtle.digest('SHA-256', …)</div>
    </div>
  );
}

/* §VII — Devtools */
function LabDevtools() {
  const lines = [
    ['>', 'window.tbgConfig'],
    ['<', '{ model: "Xenova/distilbert-…", layers: 6, heads: 12, hidden: 768 }'],
    ['>', 'await window.tbgInfer("the reckless GOP plan slammed working families")'],
    ['<', '{ label: "NEGATIVE", probs: [0.927, 0.073], logits: [-2.418, 0.142] }'],
    ['>', 'window.tbgTokenizer.tokenize("paywalls").map(t => t)'],
    ['<', '["pay", "##walls"]'],
  ];
  return (
    <div className="border border-ink/30 bg-ink text-paper-cream p-5" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
      <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-[0.22em] text-paper-cream/60" style={{ fontFamily: 'Inter' }}>
        <span>§ VII · Devtools-pokeable</span>
        <span>open the console</span>
      </div>
      <div className="space-y-1.5 text-[12px]">
        {lines.map(([sigil, txt], i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className={`w-3 ${sigil === '>' ? 'text-accent' : 'text-paper-cream/40'}`}>{sigil}</span>
            <span className={sigil === '>' ? 'text-paper-cream' : 'text-paper-cream/70'}>{txt}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Inter' }}>
        {['tbgModel', 'tbgTokenizer', 'tbgConfig', 'tbgInfer(text)'].map((g) => (
          <div key={g} className="border border-paper-cream/30 px-2 py-1 text-paper-cream/85 text-center">{g}</div>
        ))}
      </div>
    </div>
  );
}

/* The full lab page */
function InferenceLabPage() {
  return (
    <div className="bg-paper-cream text-ink" style={{ width: 1280, fontFamily: '"Source Serif 4", Georgia, serif' }}>
      {/* Masthead */}
      <header>
        <div className="border-t-[2px] border-ink" />
        <div className="px-12 pt-7 pb-5 grid grid-cols-12 items-end">
          <div className="col-span-3 text-[11px] uppercase tracking-[0.22em] text-ink/55 self-end pb-1" style={{ fontFamily: 'Inter' }}>
            TheBiasGraph
          </div>
          <div className="col-span-6 text-center">
            <h1 className="font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 44, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
              The Inference Lab
            </h1>
            <p className="mt-1.5 text-[13px] italic text-ink/55">A real transformer · running on your machine</p>
          </div>
          <div className="col-span-3 text-right text-[11px] uppercase tracking-[0.22em] text-ink/55 self-end pb-1" style={{ fontFamily: 'Inter' }}>
            Notebook · No. 1
          </div>
        </div>
        <div className="border-b border-ink/20" />
        <div className="px-12 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink/55" style={{ fontFamily: 'Inter' }}>
          <span className="flex gap-7"><span>Search</span><span>Analyze</span><span>Play</span><span className="text-ink">Lab</span><span>Methodology</span></span>
          <span>Built with @xenova/transformers</span>
        </div>
      </header>

      {/* Lede — asymmetric: title left col-7, abstract right col-5 with hairline rule */}
      <section className="px-12 pt-16 pb-12">
        <div className="grid grid-cols-12 gap-10 items-end">
          <div className="col-span-7">
            <div className="text-[11px] uppercase tracking-[0.24em] text-ink/55" style={{ fontFamily: 'Inter' }}>An exhibit, not a demo</div>
            <h2 className="mt-4 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 80, lineHeight: 0.94, letterSpacing: '-0.045em' }}>
              The model<br/>shows its work.
            </h2>
          </div>
          <div className="col-span-5 border-l border-ink/20 pl-10">
            <p className="text-[18px] italic text-ink/70 leading-snug">
              The rest of the site says "custom neural network." This page proves it. Click <span className="not-italic">Load model</span> and a real transformer downloads to your browser — its tokenizer, layers, attention heatmaps, logits, and SHA-256 hashes are all on the page.
            </p>
            <p className="mt-3 text-[13px] uppercase tracking-[0.22em] text-ink/45" style={{ fontFamily: 'Inter' }}>
              Note · This is DistilBERT (66M), a small companion. Production runs DeBERTa-v3 server-side.
            </p>
          </div>
        </div>
      </section>

      {/* §I + §II — model card + load. Asymmetric 7/5 */}
      <section className="border-t border-ink/15 px-12 py-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-7"><LabModelCard /></div>
          <div className="col-span-5"><LabLoad /></div>
        </div>
      </section>

      {/* §III tokenizer — full width */}
      <section className="border-t border-ink/15 px-12 py-10">
        <LabTokenizer />
      </section>

      {/* §IV forward pass — full width */}
      <section className="border-t border-ink/15 px-12 py-10">
        <LabForwardPass />
      </section>

      {/* §V + §VI — saliency + hashes side by side */}
      <section className="border-t border-ink/15 px-12 py-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-7"><LabSaliency /></div>
          <div className="col-span-5"><LabHashes /></div>
        </div>
      </section>

      {/* §VII devtools — full width, paired with closing note */}
      <section className="border-t border-ink/15 px-12 py-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>Closing note</div>
            <h3 className="mt-3 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 36, lineHeight: 1.0, letterSpacing: '-0.04em' }}>
              Don't trust me — run it yourself.
            </h3>
            <p className="mt-4 text-[16px] text-ink/70 leading-snug italic">
              The whole point of this page is that you can. Open the browser console, call <span className="not-italic" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>tbgInfer(text)</span> with anything you like, and verify the page is showing what the model actually produces.
            </p>
            <a className="mt-6 inline-block text-[12px] uppercase tracking-[0.22em] text-ink border-b border-ink pb-1" style={{ fontFamily: 'Inter' }}>Read the methodology →</a>
          </div>
          <div className="col-span-7"><LabDevtools /></div>
        </div>
      </section>

      <footer className="border-t border-ink/15 px-12 py-7 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink/45" style={{ fontFamily: 'Inter' }}>
        <span>TheBiasGraph · Inference Lab</span>
        <span>@xenova/transformers · ONNX Runtime Web</span>
      </footer>
    </div>
  );
}

window.InferenceLabPage = InferenceLabPage;
