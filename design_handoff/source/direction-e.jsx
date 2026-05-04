/* DIRECTION E — Editorial restrained.
   Centered nameplate, but axis breaks below the fold:
   - asymmetric two-column hero (lead headline left, search panel + abstract right)
   - paste section is 8/4 not 6/6, paste card pulled to far right
   - play strip is 5-column with the title taking col 1 alone, four games as 4 narrow cols
   - the closing note is left-rule indented with a right-rail aside */

function DirectionE_Landing() {
  return (
    <div className="bg-paper-cream text-ink" style={{ width: 1280, fontFamily: '"Source Serif 4", Georgia, serif' }}>
      {/* Masthead — centered, this is the only symmetric element */}
      <header>
        <div className="border-t-[2px] border-ink" />
        <div className="px-12 pt-7 pb-5 grid grid-cols-12 items-end">
          <div className="col-span-3 text-[11px] uppercase tracking-[0.22em] text-ink/55 self-end pb-1" style={{ fontFamily: 'Inter' }}>
            Vol. II · No. v2.0.0
          </div>
          <div className="col-span-6 text-center">
            <h1 className="font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 52, letterSpacing: '-0.045em', lineHeight: 0.95 }}>
              TheBiasGraph
            </h1>
            <p className="mt-1.5 text-[13px] italic text-ink/55">A reading instrument for comparison bias</p>
          </div>
          <div className="col-span-3 text-right text-[11px] uppercase tracking-[0.22em] text-ink/55 self-end pb-1" style={{ fontFamily: 'Inter' }}>
            Tuesday · May 2026
          </div>
        </div>
        <div className="border-b border-ink/20" />
        <div className="px-12 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink/55" style={{ fontFamily: 'Inter' }}>
          <span className="flex gap-7"><span className="text-ink">Search</span><span>Analyze</span><span>Play</span><span>Lab</span><span>Methodology</span></span>
          <span>By NeuralBias</span>
        </div>
      </header>

      {/* HERO — asymmetric. Headline left col-7, search/abstract right col-5 */}
      <section className="px-12 pt-16 pb-10">
        <div className="grid grid-cols-12 gap-12 items-end">
          <div className="col-span-7">
            <div className="text-[11px] uppercase tracking-[0.24em] text-ink/55" style={{ fontFamily: 'Inter' }}>Today's reading · No. 1</div>
            <h2 className="mt-4 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 88, lineHeight: 0.94, letterSpacing: '-0.045em' }}>
              The same story,<br/>read every which way.
            </h2>
          </div>
          <div className="col-span-5 border-l border-ink/20 pl-10">
            <p className="text-[18px] italic text-ink/70 leading-snug">
              Search any topic. A neural network reads every article we find on it and plots them across the political spectrum — so you can see the angles, not just the takes.
            </p>
            <div className="mt-7">
              <div className="flex items-center gap-3 border-2 border-ink p-3 bg-paper">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink/50 pl-1" style={{ fontFamily: 'Inter' }}>Topic</span>
                <span className="flex-1 text-lg italic text-ink/85">student loans</span>
                <button className="bg-ink px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-paper-cream" style={{ fontFamily: 'Inter' }}>Search →</button>
              </div>
              <div className="mt-3"><TopicChips size="sm" /></div>
            </div>
          </div>
        </div>

        {/* The graph below, full bleed */}
        <div className="mt-12 border-t-2 border-b border-ink py-10">
          <SpectrumGraph query="student loans" height={400} />
        </div>
      </section>

      {/* SECONDARY — paste. 8/4 split, paste pulled hard right with a small pull-quote left */}
      <section className="border-t border-ink/15 px-12 py-16">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-2 text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>
            Have one<br/>in mind?
          </div>
          <div className="col-span-5">
            <h3 className="font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 48, lineHeight: 0.98, letterSpacing: '-0.04em' }}>
              Or analyze<br/>a single article.
            </h3>
            <p className="mt-5 text-[16px] text-ink/65 leading-snug max-w-md italic">
              Paste the body or a URL — you'll get an 8-dimension reading, the loaded phrases highlighted, and a verifiable inference receipt.
            </p>
          </div>
          <div className="col-span-5">
            <div className="border-2 border-ink p-5 bg-paper">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]" style={{ fontFamily: 'Inter' }}>
                <span className="border-b border-ink text-ink pb-0.5">Paste text</span>
                <span className="text-ink/50">From URL</span>
              </div>
              <div className="mt-4 h-24 text-ink/30 italic text-[15px]">"On Thursday, House Republicans muscled through…"</div>
              <div className="flex justify-end">
                <button className="bg-ink px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-paper-cream" style={{ fontFamily: 'Inter' }}>Analyze →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLAY — 5-column: title col-1 alone, then 4 narrow game cols */}
      <section className="border-t border-ink/15 px-12 py-16">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>Department</div>
            <h3 className="mt-3 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 40, lineHeight: 0.98, letterSpacing: '-0.04em' }}>
              Play against<br/>the model.
            </h3>
            <p className="mt-3 italic text-[13px] text-ink/60 leading-snug max-w-[200px]">
              Four short games. The model has been training; how well do you read?
            </p>
          </div>
          {[
            ['Bias Detective',    'Place it on the spectrum.'],
            ['Guess the Source',  'Identify the outlet.'],
            ['Compare Two Takes', 'Pick the more biased.'],
            ['Headline Rewrite',  'Neutralize a loaded line.'],
          ].map(([t, d], i) => (
            <a key={t} className="col-span-2 block border-l border-ink/15 pl-5">
              <div className="text-[11px] tabular-nums text-ink/40" style={{ fontFamily: 'Inter' }}>0{i+1}</div>
              <div className="mt-2 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.03em' }}>{t}</div>
              <p className="mt-2 text-[13px] text-ink/55 leading-snug">{d}</p>
              <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-ink border-b border-ink inline-block pb-0.5" style={{ fontFamily: 'Inter' }}>Play</div>
            </a>
          ))}
          <div className="col-span-1 text-right text-[10px] uppercase tracking-[0.22em] text-ink/40 self-end pb-1" style={{ fontFamily: 'Inter' }}>
            /play
          </div>
        </div>
      </section>

      {/* NOTE — left-rule indented body, right-rail aside */}
      <section className="border-t border-ink/15 px-12 py-20 bg-paper-warm/30">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-1 text-[11px] uppercase tracking-[0.22em] text-ink/55 -rotate-90 origin-top-left translate-y-12" style={{ fontFamily: 'Inter' }}>
            The Note
          </div>
          <div className="col-span-7 border-l-2 border-ink pl-8">
            <p className="text-[20px] leading-[1.55] text-ink/85">
              <span className="float-left mr-3 mt-1 font-display font-black text-ink" style={{ fontFamily: '"Playfair Display", serif', fontSize: 78, lineHeight: 0.78 }}>I</span>
              built this alone over eighteen months. The model is a custom DeBERTa-v3 encoder with eight classification heads, trained on 1.24M cross-outlet article pairs with a comparison-bias objective — it reads each article relative to how the same facts are framed elsewhere, not against a fixed left/right axis.
            </p>
            <div className="mt-7 flex items-center gap-8 text-[12px] uppercase tracking-[0.2em]" style={{ fontFamily: 'Inter' }}>
              <a className="text-ink border-b border-ink pb-1">Open the Inference Lab →</a>
              <a className="text-ink/70 border-b border-ink/30 pb-1">Read the methodology →</a>
            </div>
          </div>
          {/* Right rail — aside box */}
          <aside className="col-span-4 border border-ink/30 p-5 bg-paper self-start">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55" style={{ fontFamily: 'Inter' }}>By the numbers</div>
            <div className="mt-3 space-y-2.5" style={{ fontFamily: 'Inter' }}>
              {[
                ['DeBERTa-v3 base', '139M params'],
                ['Cross-outlet pairs', '1.24M'],
                ['Outlets covered', '312'],
                ['Held-out concordance', '94.1%'],
                ['Built by', 'one engineer'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between text-[12px]">
                  <span className="text-ink/60">{k}</span>
                  <span className="tabular-nums text-ink font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <footer className="border-t border-ink/15 px-12 py-7 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink/45" style={{ fontFamily: 'Inter' }}>
        <span>TheBiasGraph · v2.0.0</span>
        <span>By NeuralBias · LinkedIn</span>
      </footer>
    </div>
  );
}

window.DirectionE_Landing = DirectionE_Landing;
