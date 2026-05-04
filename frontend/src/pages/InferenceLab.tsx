import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Masthead from '../components/Masthead'
import {
  MODEL_ID,
  MODEL_CARD_URL,
  QUANTIZED,
  loadModel,
  runForwardPass,
  tokenizePreview,
  formatBytes,
  sha256Hex,
  type LoadedRuntime,
  type InferenceArtifacts,
  type ProgressEvent,
} from '../lib/inferenceLab'

const SAMPLE_TEXT =
  "The reckless GOP plan slammed working families on Thursday."

const SPECIAL_TOKENS = new Set([
  '[CLS]', '[SEP]', '[PAD]', '[UNK]', '[MASK]',
  '<s>', '</s>', '<pad>', '<unk>', '<mask>',
])

// RoBERTa BPE marks word-initial pieces with `Ġ` (a U+0120 character that
// stands in for a leading space). BERT WordPiece marks word-continuations
// with `##`. Strip both for display.
function displayToken(tok: string): string {
  if (tok.startsWith('##')) return tok.slice(2)
  if (tok.startsWith('Ġ')) return tok.slice(1)
  return tok
}

interface ProgressFile {
  name: string
  url?: string
  loaded: number
  total: number
  done: boolean
}

interface LoaderLine {
  id: number
  ts: string
  kind: string
  text: string
}

let _loaderLineCounter = 0
function makeLoaderLine(kind: string, text: string): LoaderLine {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return {
    id: ++_loaderLineCounter,
    ts: `${hh}:${mm}:${ss}.${ms}`,
    kind,
    text,
  }
}

function classifyLogKind(text: string): string {
  const t = text.toLowerCase()
  if (t.startsWith('[fetch]')) return 'fetch'
  if (t.startsWith('[done]')) return 'done'
  if (t.startsWith('[ready]')) return 'ready'
  if (t.includes('error')) return 'error'
  if (t.includes('exposed')) return 'export'
  if (t.includes('cache') || t.includes('idb')) return 'cache'
  if (t.includes('forward path') || t.includes('runtime ready')) return 'init'
  return 'info'
}

// ---------- the page ----------

export default function InferenceLab() {
  const [loaderLines, setLoaderLines] = useState<LoaderLine[]>([])
  const [files, setFiles] = useState<Record<string, ProgressFile>>({})
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState<LoadedRuntime | null>(null)
  const [text, setText] = useState(SAMPLE_TEXT)
  const [tokenizedPreview, setTokenizedPreview] = useState<{
    tokens: string[]
    ids: number[]
    spans: [number, number][]
  } | null>(null)
  const [running, setRunning] = useState(false)
  const [artifacts, setArtifacts] = useState<InferenceArtifacts | null>(null)
  const [logitsHash, setLogitsHash] = useState<string | null>(null)
  const [inputHash, setInputHash] = useState<string | null>(null)
  const [matchRuns, setMatchRuns] = useState(0)
  const [hashesMatch, setHashesMatch] = useState(false)
  const [wallClockDisplay, setWallClockDisplay] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const pushLoader = useCallback((kind: string, text: string) => {
    setLoaderLines((prev) => [...prev, makeLoaderLine(kind, text)])
  }, [])

  const log = useCallback((text: string) => {
    pushLoader(classifyLogKind(text), text)
  }, [pushLoader])

  const onProgress = useCallback((e: ProgressEvent) => {
    if (!e.file && !e.name) return
    const key = e.file ?? e.name ?? 'unknown'
    setFiles((prev) => {
      const cur =
        prev[key] ?? ({ name: key, loaded: 0, total: 0, done: false } as ProgressFile)
      if (e.status === 'initiate') {
        return { ...prev, [key]: { ...cur, done: false } }
      }
      if (e.status === 'progress') {
        return {
          ...prev,
          [key]: {
            ...cur,
            loaded: typeof e.loaded === 'number' ? e.loaded : cur.loaded,
            total: typeof e.total === 'number' ? e.total : cur.total,
          },
        }
      }
      if (e.status === 'done') {
        return {
          ...prev,
          [key]: {
            ...cur,
            done: true,
            loaded: typeof e.total === 'number' ? e.total : cur.loaded,
            total: typeof e.total === 'number' ? e.total : cur.total,
          },
        }
      }
      return prev
    })
  }, [])

  const onLoad = useCallback(async () => {
    if (loading || loaded) return
    setLoading(true)
    setLoadError(null)
    pushLoader('user', `> load model · ${MODEL_ID}`)
    try {
      const rt = await loadModel(onProgress, log)
      setLoaded(rt)
      pushLoader(
        'ready',
        `READY · ${rt.config.modelType} · ${rt.config.numLayers}L · ${rt.config.numHeads}H · d=${rt.config.hiddenDim}`,
      )
    } catch (err) {
      const msg = (err as Error).message || 'unknown error'
      setLoadError(msg)
      pushLoader('error', `ERROR · ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [loading, loaded, log, onProgress, pushLoader])

  // auto-scroll loader on new lines
  useEffect(() => {
    if (loaderRef.current) {
      loaderRef.current.scrollTop = loaderRef.current.scrollHeight
    }
  }, [loaderLines.length])

  // live tokenization (debounced)
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      try {
        const out = tokenizePreview(text)
        setTokenizedPreview({ tokens: out.tokens, ids: out.ids, spans: out.charSpans })
      } catch {
        // ignore
      }
    }, 120)
    return () => clearTimeout(t)
  }, [text, loaded])

  // count-up wall clock animation when artifacts arrive
  useEffect(() => {
    if (!artifacts) {
      setWallClockDisplay(0)
      return
    }
    const target = artifacts.forwardMs
    const dur = 400
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const e = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - e, 3)
      setWallClockDisplay(target * eased)
      if (e < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [artifacts])

  const runOnce = useCallback(async (): Promise<{ a: InferenceArtifacts; lhash: string } | null> => {
    if (!loaded) return null
    const a = await runForwardPass(text)
    const lhash = await sha256Hex(JSON.stringify(a.logits))
    return { a, lhash }
  }, [loaded, text])

  const onRunForward = useCallback(async () => {
    if (!loaded || running) return
    setRunning(true)
    setRunError(null)
    try {
      const r = await runOnce()
      if (!r) return
      setArtifacts(r.a)
      const ihash = await sha256Hex(text)
      setInputHash(ihash)
      setLogitsHash(r.lhash)
      setMatchRuns(1)
      setHashesMatch(true)
    } catch (err) {
      const msg = (err as Error).message || 'unknown error'
      setRunError(msg)
      pushLoader('error', `ERROR · forward · ${msg}`)
    } finally {
      setRunning(false)
    }
  }, [loaded, running, text, runOnce, pushLoader])

  const onReRun = useCallback(async () => {
    if (!loaded || running || !logitsHash) return
    setRunning(true)
    setRunError(null)
    try {
      const r = await runOnce()
      if (!r) return
      setArtifacts(r.a)
      const same = r.lhash === logitsHash
      setHashesMatch(same)
      setMatchRuns((n) => (same ? n + 1 : 1))
      if (!same) setLogitsHash(r.lhash)
    } catch (err) {
      const msg = (err as Error).message || 'unknown error'
      setRunError(msg)
      pushLoader('error', `ERROR · re-run · ${msg}`)
    } finally {
      setRunning(false)
    }
  }, [loaded, running, logitsHash, runOnce, pushLoader])

  // ---------- derived ----------

  const fileList = useMemo(() => Object.values(files), [files])
  const allLoadedSize = fileList.reduce((a, f) => a + f.loaded, 0)
  const charCount = text.length

  return (
    <div className="min-h-screen bg-paper-cream text-ink">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <Masthead subtitle="The Inference Lab" right="Notebook · No. 1" />
      </motion.div>

      <main>
        {/* ---------- Lede ---------- */}
        <motion.section
          className="px-12 pt-16 pb-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-7">
              <div className="font-sans text-[11px] uppercase tracking-[0.24em] text-ink/55">
                An exhibit, not a demo
              </div>
              <h2 className="mt-4 font-display font-black text-ink tracking-mega-tight leading-[0.94] text-[80px]">
                The model
                <br />
                shows its work.
              </h2>
            </div>
            <div className="col-span-5 border-l border-ink/20 pl-10">
              <p className="font-serif text-[18px] italic text-ink/70 leading-snug">
                Click <span className="not-italic">Load model</span> and a real
                DistilRoBERTa bias classifier downloads to your browser. Type
                any sentence and the model — fine-tuned on Wikipedia
                neutrality-edit pairs by Spinde et al. — labels it{' '}
                <strong>BIASED</strong> or <strong>NEUTRAL</strong>. Every
                number on this page is computed from the weights running in
                front of you.
              </p>
              <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                Model · valurank/distilroberta-bias · DistilRoBERTa-base · 6
                layers · 12 heads · trained on the Wiki-Neutrality Corpus
                (~180k sentence pairs). The production TheBiasGraph score is a
                separate server-side composite — this is the in-browser linguistic-bias
                signal that the production system rolls up.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-8">
            <ReadingGuide
              who="New to ML?"
              tone="serif"
              body="Type a sentence and click Run. The model votes BIASED or NEUTRAL. The orange bars under each word show how much the verdict would change if that word disappeared — bigger bar means the model leaned harder on that word. Try the same sentence reworded neutrally and watch the bars shrink."
            />
            <ReadingGuide
              who="ML reader?"
              tone="mono"
              body="DistilRoBERTa fine-tuned on WNC (Recasens 2013 / Pryzant 2020 corpus). ONNX int8, ~82 MB. Token importance via leave-one-out occlusion (mask each non-special token, Δp_argmax). Logits + SHA-256 hashes on page. window.tbgInfer(text) returns the same artifacts."
            />
          </div>
        </motion.section>

        {/* ---------- §I + §II — Model card + Loader ---------- */}
        <ScrollSection>
          <div className="border-t border-ink/15 px-12 py-12">
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-7">
                <SectionHeader numeral="§ I" label="Model card" />
                <ModelCard loaded={loaded} />
              </div>
              <div className="col-span-5">
                <SectionHeader numeral="§ II" label="Loader" />
                <LoaderTerminal
                  ref={loaderRef}
                  lines={loaderLines}
                  loaded={loaded}
                  loading={loading}
                  onLoad={onLoad}
                  loadedBytes={loaded?.totalBytes || allLoadedSize}
                  files={fileList}
                  error={loadError}
                />
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* ---------- §III Tokenizer ---------- */}
        <ScrollSection>
          <div className="border-t border-ink/15 px-12 py-12">
            <SectionHeader numeral="§ III" label="Tokenizer" />
            <TokenizerPanel
              text={text}
              setText={setText}
              loaded={loaded}
              tokenizedPreview={tokenizedPreview}
              charCount={charCount}
            />
          </div>
        </ScrollSection>

        {/* ---------- §IV Forward pass ---------- */}
        <ScrollSection>
          <div className="border-t border-ink/15 px-12 py-12">
            <div className="flex items-end justify-between">
              <SectionHeader numeral="§ IV" label="Forward pass" />
              <div className="text-right pb-2">
                <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Wall clock
                </div>
                <div className="font-mono text-[18px] tabular-nums text-ink">
                  {artifacts ? `${wallClockDisplay.toFixed(3)} ms` : '— · —'}
                </div>
              </div>
            </div>
            <ForwardPassPanel
              loaded={loaded}
              artifacts={artifacts}
              running={running}
              onRun={onRunForward}
              onReRun={onReRun}
              runError={runError}
            />
          </div>
        </ScrollSection>

        {/* ---------- §V + §VI — Saliency + Hashes ---------- */}
        <ScrollSection>
          <div className="border-t border-ink/15 px-12 py-12">
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-7">
                <SectionHeader numeral="§ V" label="Saliency" />
                <SaliencyPanel artifacts={artifacts} />
              </div>
              <div className="col-span-5">
                <SectionHeader numeral="§ VI" label="Hashes" />
                <HashesPanel
                  inputHash={inputHash}
                  logitsHash={logitsHash}
                  matchRuns={matchRuns}
                  hashesMatch={hashesMatch}
                />
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* ---------- §VII Devtools ---------- */}
        <ScrollSection>
          <div className="border-t border-ink/15 px-12 py-12">
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-5">
                <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
                  Closing note
                </div>
                <h3 className="mt-3 font-display font-black text-ink tracking-display-tight leading-[1.0] text-[30px]">
                  Don't trust me — run it yourself.
                </h3>
                <p className="mt-4 font-serif text-[16px] italic text-ink/70 leading-snug">
                  Every number on this page comes back from the model in your
                  browser. Open devtools and call{' '}
                  <span className="not-italic font-mono text-[14px] text-ink">tbgInfer(text)</span>{' '}
                  with any string — you'll get the same logits, the same
                  argmax, and the same occlusion scores the page just rendered.
                  No fixtures, no fakes.
                </p>
                <Link
                  to="/how-i-built-this"
                  className="mt-6 inline-block font-sans text-[12px] uppercase tracking-[0.22em] text-ink border-b border-ink pb-1 hover:text-accent hover:border-accent transition-colors"
                >
                  Read the methodology &rarr;
                </Link>
              </div>
              <div className="col-span-7">
                <SectionHeader numeral="§ VII" label="Devtools" />
                <DevtoolsPanel artifacts={artifacts} text={text} loaded={loaded} />
              </div>
            </div>
          </div>
        </ScrollSection>

        <footer className="border-t border-ink/15 px-12 py-7 flex items-center justify-between font-sans text-[11px] uppercase tracking-[0.22em] text-ink/55">
          <span>TheBiasGraph &middot; Inference Lab</span>
          <span>
            @xenova/transformers
            {loaded ? ` · v${loaded.transformersVersion}` : ''} &middot; ONNX Runtime Web
          </span>
        </footer>
      </main>
    </div>
  )
}

// ---------- atomic editorial subcomponents ----------

function ScrollSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.section>
  )
}

function PlainEnglish({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 border-l-2 border-accent/60 pl-4 py-1">
      <div className="font-sans text-[9px] uppercase tracking-[0.28em] text-accent/85 mb-1">
        In plain English
      </div>
      <p className="font-serif text-[14px] text-ink/75 leading-snug">{children}</p>
    </div>
  )
}

function ReadingGuide({
  who,
  body,
  tone,
}: {
  who: string
  body: string
  tone: 'serif' | 'mono'
}) {
  return (
    <div className="col-span-6 border-t border-ink/20 pt-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.24em] text-accent">
        {who}
      </div>
      <p
        className={`mt-2 text-[14px] leading-snug text-ink/75 ${
          tone === 'serif' ? 'font-serif italic' : 'font-mono'
        }`}
      >
        {body}
      </p>
    </div>
  )
}

function SectionHeader({ numeral, label }: { numeral: string; label: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 font-sans text-[10px] uppercase tracking-[0.24em] text-ink/65">
        <span className="text-ink">{numeral}</span>
        <span className="text-ink/30">—</span>
        <span>{label}</span>
        <span className="ml-2 flex-1 border-t border-ink/20" />
      </div>
    </div>
  )
}

// ---------- §I — Model card ----------

function ModelCard({ loaded }: { loaded: LoadedRuntime | null }) {
  const cfg = loaded?.config
  const tk = loaded?.tokenizerInfo
  const [showRaw, setShowRaw] = useState(false)
  const dash = '—'
  const rows: Array<[string, string]> = [
    ['Model', MODEL_ID],
    ['Architecture', cfg ? `${cfg.modelType} · ${cfg.architectures[0] ?? 'encoder-only'}` : dash],
    ['Layers · Heads', cfg ? `${cfg.numLayers} · ${cfg.numHeads}` : dash],
    ['Hidden dim', cfg ? String(cfg.hiddenDim) : dash],
    ['Intermediate dim', cfg ? String(cfg.intermediateDim) : dash],
    ['Vocab', cfg ? cfg.vocabSize.toLocaleString() : dash],
    ['Max position', cfg ? String(cfg.maxPositionEmbeddings) : dash],
    ['Tokenizer', tk ? tk.type : dash],
    ['CLS · SEP · PAD', tk ? `${tk.clsId} · ${tk.sepId} · ${tk.padId}` : dash],
    ['Quantization', loaded ? (QUANTIZED ? 'int8' : 'fp32') : dash],
  ]
  return (
    <div className="border-2 border-ink p-6 bg-paper">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            valurank/distilroberta-bias
          </div>
          <h2 className="mt-2 font-display font-black text-ink tracking-display-tight leading-[1.0] text-[34px]">
            A real bias classifier.
          </h2>
          <p className="mt-1 font-serif italic text-ink/60 text-[14px]">
            DistilRoBERTa fine-tuned on the Wiki-Neutrality Corpus —
            sentence-level BIASED vs NEUTRAL.
          </p>
        </div>
        <a
          href={MODEL_CARD_URL}
          target="_blank"
          rel="noreferrer"
          className="font-sans text-[11px] uppercase tracking-[0.2em] text-ink border-b border-ink pb-1 hover:text-accent hover:border-accent transition-colors shrink-0"
        >
          View on Hugging Face &rarr;
        </a>
      </div>

      <PlainEnglish>
        Think of this as the recipe card for the model that's about to land
        in your browser. <strong>Layers</strong> are how many times the
        network re-reads the sentence. <strong>Heads</strong> are how many
        different "angles" it considers each pass. <strong>Hidden dim</strong>{' '}
        is how much room each word gets to be described in. The fields stay
        as <span className="font-mono not-italic">—</span> until the model
        actually arrives.
      </PlainEnglish>

      <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-1 font-mono text-[13px]">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-3 border-b border-ink/15 py-1.5"
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink/55">
              {k}
            </span>
            <span
              className={`truncate text-right tabular-nums ${v === dash ? 'text-ink/30' : 'text-ink'}`}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {cfg && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRaw((s) => !s)}
            className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/65 border-b border-ink/30 pb-0.5 hover:text-accent hover:border-accent transition-colors"
          >
            {showRaw ? '— hide raw config.json' : '+ raw config.json'}
          </button>
          <AnimatePresence>
            {showRaw && (
              <motion.pre
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 max-h-[260px] overflow-auto bg-ink text-paper-cream/85 p-3 font-mono text-[10.5px] leading-[1.55] whitespace-pre"
              >
                {JSON.stringify(cfg.raw, null, 2)}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-4 flex items-baseline justify-between font-sans text-[10px] uppercase tracking-[0.18em] text-ink/45">
        <span>Powered by transformers.js · ONNX Runtime Web</span>
        {loaded ? <span>v{loaded.transformersVersion}</span> : <span>not loaded</span>}
      </div>
    </div>
  )
}

// ---------- §II — Loader terminal ----------

const LoaderTerminal = ({
  ref,
  lines,
  loaded,
  loading,
  onLoad,
  loadedBytes,
  files,
  error,
}: {
  ref: React.RefObject<HTMLDivElement | null>
  lines: LoaderLine[]
  loaded: LoadedRuntime | null
  loading: boolean
  onLoad: () => void
  loadedBytes: number
  files: ProgressFile[]
  error: string | null
}) => {
  return (
    <div className="border-2 border-ink bg-ink text-paper-cream p-4 min-h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-paper-cream/60">
        <span>tbg-lab.log</span>
        <span>{lines.length} lines</span>
      </div>
      <div
        ref={ref}
        className="flex-1 overflow-auto font-mono text-[12px] leading-[1.55] space-y-0.5"
        style={{ maxHeight: 320 }}
      >
        {lines.length === 0 ? (
          <span className="text-paper-cream/35">{'> idle · click "Load model" below'}</span>
        ) : (
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-baseline gap-3"
              >
                <span className="text-paper-cream/40 tabular-nums shrink-0 w-[88px]">
                  [{l.ts}]
                </span>
                <span
                  className={`shrink-0 w-[60px] uppercase tracking-[0.18em] text-[10px] font-sans ${
                    l.kind === 'error'
                      ? 'text-accent'
                      : l.kind === 'ready' || l.kind === 'done' || l.kind === 'export'
                        ? 'text-emerald-400'
                        : 'text-accent'
                  }`}
                >
                  {l.kind}
                </span>
                <span className="text-paper-cream break-all">{l.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* file progress row */}
      {files.length > 0 && !loaded && (
        <div className="mt-3 space-y-1">
          {files.slice(-3).map((f) => {
            const pct = f.total > 0 ? Math.min(100, (f.loaded / f.total) * 100) : f.done ? 100 : 0
            return (
              <div key={f.name} className="font-mono text-[10px] text-paper-cream/70">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <span className="tabular-nums shrink-0">
                    {formatBytes(f.loaded)}
                    {f.total ? ` / ${formatBytes(f.total)}` : ''} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-0.5 h-[2px] w-full bg-paper-cream/15">
                  <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <div className="mt-3 border border-accent bg-accent/10 px-3 py-2 font-mono text-[11px] text-accent leading-snug break-words">
          ⚠ load failed · {error}
        </div>
      )}

      {/* footer */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {loaded ? (
          <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-emerald-400">
            <span className="inline-block h-[8px] w-[8px] bg-emerald-400" aria-hidden />
            <span>
              READY · {formatBytes(loadedBytes)} · cached in IndexedDB
            </span>
          </div>
        ) : error ? (
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
            error · retry below
          </span>
        ) : (
          <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-paper-cream/55">
            {loading ? 'streaming…' : 'awaiting input'}
          </span>
        )}
        <button
          type="button"
          onClick={onLoad}
          disabled={loading || !!loaded}
          className="bg-paper-cream text-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.22em] hover:bg-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loaded ? 'Loaded' : loading ? 'Loading…' : error ? 'Retry' : 'Load model'}
        </button>
      </div>
    </div>
  )
}

// ---------- §III Tokenizer ----------

function TokenizerPanel({
  text,
  setText,
  loaded,
  tokenizedPreview,
  charCount,
}: {
  text: string
  setText: (t: string) => void
  loaded: LoadedRuntime | null
  tokenizedPreview: { tokens: string[]; ids: number[]; spans: [number, number][] } | null
  charCount: number
}) {
  return (
    <div>
      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!loaded}
            rows={3}
            className="w-full bg-paper-cream border border-ink/30 p-4 font-serif italic text-[18px] text-ink leading-[1.55] resize-none focus:outline-none focus:border-ink disabled:opacity-50"
            placeholder={loaded ? 'Type something to tokenize …' : 'Load the model first.'}
          />
          <PlainEnglish>
            Computers don't read words — they read numbers. The tokenizer
            chops your sentence into small pieces (a word, sometimes a
            fragment of a word) and looks each piece up in a dictionary of{' '}
            {loaded ? loaded.config.vocabSize.toLocaleString() : 'tens of thousands'}{' '}
            entries. The numbers below each chip are those dictionary IDs.{' '}
            {loaded?.config.modelType === 'roberta' ? (
              <>
                A <span className="font-mono">Ġ</span> prefix marks the start
                of a new word (it stands in for a leading space).
              </>
            ) : (
              <>
                Pieces that begin with <span className="font-mono">##</span>{' '}
                are continuations of the previous word.
              </>
            )}
          </PlainEnglish>
        </div>
        <div className="col-span-4 text-right pt-1">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            seq · chars · max
          </div>
          <div className="mt-1 font-mono text-[13px] tabular-nums text-ink">
            {tokenizedPreview ? tokenizedPreview.tokens.length : '—'} ·{' '}
            {charCount} ·{' '}
            {tokenizedPreview ? tokenizedPreview.tokens.length : '—'}
            {loaded ? `/${loaded.config.maxPositionEmbeddings}` : ''}
          </div>
          <div className="mt-3 font-serif italic text-[13px] text-ink/55">
            tokens come straight from{' '}
            <span className="not-italic font-mono text-[12px] text-ink">tokenizer(text).input_ids</span>
          </div>
          {tokenizedPreview && loaded && (
            <div className="mt-4 font-mono text-[10px] text-ink/50 tabular-nums leading-[1.7]">
              [CLS]={loaded.tokenizerInfo.clsId}
              <br />
              [SEP]={loaded.tokenizerInfo.sepId}
              <br />
              [PAD]={loaded.tokenizerInfo.padId}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap">
        {tokenizedPreview && tokenizedPreview.tokens.length > 0 ? (
          <AnimatePresence initial={false}>
            {tokenizedPreview.tokens.map((tok, i) => {
              const isSpecial = SPECIAL_TOKENS.has(tok)
              return (
                <motion.span
                  key={`${i}-${tok}-${tokenizedPreview.ids[i]}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  className="inline-flex flex-col items-center border border-ink/30 bg-paper px-2 py-1 mr-1.5 mb-1.5 min-w-[48px]"
                >
                  <span className="font-sans text-[8px] tabular-nums text-ink/35 leading-none">
                    pos {i}
                  </span>
                  <span
                    className={`mt-0.5 font-mono text-[13px] ${
                      isSpecial ? 'text-accent' : 'text-ink'
                    }`}
                  >
                    {tok}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-ink/50">
                    {tokenizedPreview.ids[i]}
                  </span>
                </motion.span>
              )
            })}
          </AnimatePresence>
        ) : (
          <span className="font-mono text-[12px] text-ink/40">
            {loaded ? '> waiting for input …' : '> load model to enable tokenizer'}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------- §IV Forward pass ----------

function ForwardPassPanel({
  loaded,
  artifacts,
  running,
  onRun,
  onReRun,
  runError,
}: {
  loaded: LoadedRuntime | null
  artifacts: InferenceArtifacts | null
  running: boolean
  onRun: () => void
  onReRun: () => void
  runError: string | null
}) {
  const verdict = useMemo(() => {
    if (!artifacts || !loaded) return null
    const labels = loaded.config.id2label
    const top = artifacts.argmax
    const topLabel = labels[top] ?? `class_${top}`
    const topProb = artifacts.probs[top]
    const margin =
      artifacts.probs.length === 2
        ? Math.abs(artifacts.probs[0] - artifacts.probs[1])
        : null
    return { topLabel, topProb, margin }
  }, [artifacts, loaded])

  return (
    <div>
      <PlainEnglish>
        A "forward pass" is one full read of your sentence by the network. The
        sentence enters as numbers, flows through{' '}
        {loaded ? loaded.config.numLayers : 'several'} stacked encoder layers,
        and exits as a vote between two labels: <strong>BIASED</strong> and{' '}
        <strong>NEUTRAL</strong>. We then re-run the model with each
        non-special word masked to measure exactly which words pushed the
        verdict where it ended up.
      </PlainEnglish>

      {runError && (
        <div className="mt-4 border-2 border-accent bg-accent/5 p-3 font-mono text-[12px] text-accent">
          ⚠ {runError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-12 gap-8">
        {/* Verdict + logits */}
        <div className="col-span-5">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2">
            Sentiment verdict
          </div>
          <div className="border-2 border-ink p-5 bg-paper min-h-[200px]">
            {verdict ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-black text-[44px] leading-none text-accent tracking-display-tight">
                    {verdict.topLabel}
                  </span>
                  <span className="font-mono text-[14px] tabular-nums text-ink/65">
                    {(verdict.topProb * 100).toFixed(2)}%
                  </span>
                </div>
                {verdict.margin !== null && (
                  <div className="mt-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
                    margin · {(verdict.margin * 100).toFixed(2)} pts
                  </div>
                )}
              </>
            ) : (
              <div className="font-serif italic text-[14px] text-ink/40">
                No verdict yet — run a forward pass.
              </div>
            )}

            <div className="mt-4 space-y-1.5 font-mono text-[12px]">
              {artifacts ? (
                artifacts.logits.map((lg, i) => {
                  const labels = loaded?.config.id2label ?? {}
                  const label = labels[i] ?? `class_${i}`
                  const prob = artifacts.probs[i]
                  const top = i === artifacts.argmax
                  return (
                    <div
                      key={i}
                      className={`flex items-baseline gap-3 border-b border-ink/10 py-1 ${
                        top ? 'text-ink' : 'text-ink/55'
                      }`}
                    >
                      <span className="font-sans w-24 uppercase tracking-[0.18em] text-[10px]">
                        {label}
                      </span>
                      <span className="tabular-nums">
                        z={`${lg >= 0 ? '+' : ''}${lg.toFixed(3)}`}
                      </span>
                      <div className="flex-1 mx-2 h-[6px] bg-ink/10 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-accent"
                          style={{ width: `${(prob * 100).toFixed(2)}%` }}
                        />
                      </div>
                      <span className="tabular-nums w-14 text-right">
                        {(prob * 100).toFixed(2)}%
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-ink/40 font-serif italic">
                  awaiting forward pass
                </div>
              )}
            </div>
            <div className="mt-3 font-mono text-[10.5px] text-ink/55">
              p_i = e^(z_i − max z) / Σ e^(z_j − max z)
            </div>
          </div>
          <div className="mt-3 font-serif italic text-[12px] text-ink/55 leading-snug">
            BIASED / NEUTRAL come from the model's training labels — Wikipedia
            sentences before vs after a Neutral-Point-of-View edit. A high
            BIASED score means the sentence reads like an editor would have
            re-written it.
          </div>
        </div>

        {/* Occlusion saliency bar chart (the "graph") */}
        <div className="col-span-7">
          <div className="flex items-baseline justify-between mb-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            <span>Occlusion saliency · per token</span>
            <span className="tabular-nums text-ink/40">
              {artifacts
                ? `${artifacts.occlusionRuns} mask runs · ${artifacts.totalMs.toFixed(0)} ms total`
                : '—'}
            </span>
          </div>
          <OcclusionChart artifacts={artifacts} />
          <div className="mt-3 font-mono text-[10.5px] text-ink/55 leading-[1.6]">
            score_i = max(0, p_argmax(x) − p_argmax(x \ tok_i)) ·{' '}
            <span className="text-ink/40">leave-one-out, [MASK] substitution</span>
          </div>
          <PlainEnglish>
            Each bar shows how much the verdict's confidence drops when that
            single word disappears. A tall bar means the model leaned hard on
            that word. A near-zero bar means the model could shrug off that
            word and still vote the same way.
          </PlainEnglish>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-8">
        <div className="col-span-12">
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2">
            What the ONNX session actually returned
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-[12px]">
            <div className="border border-ink/30 bg-paper p-3">
              <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/55">
                input_ids
              </div>
              <div className="mt-1 text-ink/80 break-all leading-snug">
                {artifacts
                  ? `[${artifacts.inputIds.join(', ')}]`
                  : '—'}
              </div>
              <div className="mt-2 text-ink/40 text-[10px]">
                shape · [1, {artifacts ? artifacts.inputIds.length : '—'}]
              </div>
            </div>
            <div className="border border-ink/30 bg-paper p-3">
              <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/55">
                attention_mask
              </div>
              <div className="mt-1 text-ink/80 break-all leading-snug">
                {artifacts
                  ? `[${artifacts.attentionMask.join(', ')}]`
                  : '—'}
              </div>
              <div className="mt-2 text-ink/40 text-[10px]">
                1 = real token · 0 = padding
              </div>
            </div>
            <div className="border border-ink/30 bg-paper p-3">
              <div className="font-sans text-[9px] uppercase tracking-[0.22em] text-ink/55">
                logits
              </div>
              <div className="mt-1 text-ink/80 break-all leading-snug">
                {artifacts
                  ? `[${artifacts.logits.map((l) => l.toFixed(4)).join(', ')}]`
                  : '—'}
              </div>
              <div className="mt-2 text-ink/40 text-[10px]">
                shape · [1, {artifacts ? artifacts.logits.length : '—'}]
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onReRun}
          disabled={!artifacts || running}
          className="border border-ink px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-ink hover:text-paper-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? 'running…' : 'Re-run'}
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={!loaded || running}
          className="bg-ink text-paper-cream px-5 py-2 font-sans text-[11px] uppercase tracking-[0.18em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? 'computing…' : 'Run forward pass →'}
        </button>
      </div>
    </div>
  )
}

function OcclusionChart({ artifacts }: { artifacts: InferenceArtifacts | null }) {
  if (!artifacts) {
    return (
      <div className="border border-dashed border-ink/30 bg-paper h-[220px] flex items-center justify-center">
        <span className="font-serif italic text-[13px] text-ink/35 px-3 text-center leading-snug">
          Run a forward pass — saliency is computed by re-running the model
          with each word masked, one at a time.
        </span>
      </div>
    )
  }

  const scores = artifacts.occlusionScores
  const max = scores.reduce((m, v) => (v > m ? v : m), 1e-6)
  const tokens = artifacts.tokenStrings

  return (
    <div className="border border-ink/30 bg-paper p-4">
      <div className="space-y-1.5">
        {tokens.map((tok, i) => {
          const isSpecial = SPECIAL_TOKENS.has(tok)
          const score = scores[i] ?? 0
          const widthPct = isSpecial ? 0 : (score / max) * 100
          const display = displayToken(tok)
          return (
            <motion.div
              key={`${i}-${tok}`}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02, duration: 0.18 }}
              className="flex items-center gap-2"
            >
              <span className="font-mono text-[9px] tabular-nums text-ink/35 w-6 text-right">
                {i}
              </span>
              <span
                className={`font-mono text-[12px] w-28 truncate ${
                  isSpecial ? 'text-ink/30' : 'text-ink'
                }`}
                title={tok}
              >
                {display}
              </span>
              <div className="flex-1 h-[10px] bg-ink/5 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.02, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-accent"
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-ink/55 w-14 text-right">
                {isSpecial ? '—' : `−${(score * 100).toFixed(2)}%`}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink/35 w-16 text-right">
                {isSpecial
                  ? ''
                  : `Δz ${artifacts.occlusionDeltas[i] >= 0 ? '+' : ''}${artifacts.occlusionDeltas[i].toFixed(2)}`}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- §V Saliency ----------

function SaliencyPanel({ artifacts }: { artifacts: InferenceArtifacts | null }) {
  return (
    <div className="border border-ink/30 bg-paper p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
            Leave-one-out occlusion · per-token
          </div>
          <h3 className="mt-1 font-display font-black text-ink tracking-display-tight leading-[1.0] text-[26px]">
            Where the model looked.
          </h3>
        </div>
        <span className="font-mono text-[11px] text-ink/45">
          score = Δp(argmax)
        </span>
      </div>

      <PlainEnglish>
        Each word is highlighted in proportion to how much the verdict's
        confidence drops when that word is masked out. This is genuine
        importance — not a guess. If "reckless" or "slammed" lights up, the
        model genuinely needed those words to vote the way it did.
      </PlainEnglish>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {artifacts ? (
          <SaliencyChips
            tokens={artifacts.tokenStrings}
            scores={artifacts.occlusionScores}
          />
        ) : (
          <span className="font-mono text-[12px] text-ink/40">
            {'> run forward pass to compute occlusion scores.'}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        <span>low</span>
        <div
          className="flex-1 h-2 border border-ink/15"
          style={{ background: 'linear-gradient(to right, transparent, #B91C1C)' }}
        />
        <span>high</span>
      </div>
    </div>
  )
}

function SaliencyChips({ tokens, scores }: { tokens: string[]; scores: number[] }) {
  const max = useMemo(() => {
    let m = 0
    for (const s of scores) if (s > m) m = s
    return m || 1
  }, [scores])

  return (
    <>
      {tokens.map((tok, i) => {
        const isSpecial = SPECIAL_TOKENS.has(tok)
        const display = displayToken(tok)
        const target = (scores[i] / max) * 0.7
        return (
          <motion.span
            key={`${i}-${tok}`}
            initial={{ backgroundColor: 'rgba(185, 28, 28, 0)' }}
            animate={{ backgroundColor: `rgba(185, 28, 28, ${target.toFixed(3)})` }}
            transition={{ duration: 0.6, delay: i * 0.03 }}
            className="px-2 py-1 text-[14px]"
            style={{
              fontFamily: isSpecial
                ? 'ui-monospace, Menlo, monospace'
                : '"Source Serif 4", serif',
              color: isSpecial ? '#B91C1C' : '#111',
            }}
          >
            {display}
          </motion.span>
        )
      })}
    </>
  )
}

// ---------- §VI Hashes ----------

function HashesPanel({
  inputHash,
  logitsHash,
  matchRuns,
  hashesMatch,
}: {
  inputHash: string | null
  logitsHash: string | null
  matchRuns: number
  hashesMatch: boolean
}) {
  return (
    <div className="space-y-4">
      <PlainEnglish>
        A hash is a fingerprint. Same input, same machine, same model →{' '}
        <em>identical</em> fingerprint. We hash both the text you typed and
        the raw numbers the model produced. Re-run a few times: the
        fingerprint either stays put (deterministic) or drifts a hair
        (floating-point in WebAssembly threads). Either way, you can verify
        nothing on this page was pre-baked.
      </PlainEnglish>
      <HashBlock label="Input · sha-256" value={inputHash} />
      <HashBlock label="Logits · sha-256" value={logitsHash} />
      <AnimatePresence>
        {logitsHash && hashesMatch && matchRuns > 0 && (
          <motion.div
            key={`match-${matchRuns}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.22em] text-emerald-700"
          >
            <span
              className="inline-block h-[10px] w-[10px] bg-emerald-700"
              aria-hidden
            />
            <span>
              MATCH &middot; {matchRuns} run{matchRuns === 1 ? '' : 's'}
            </span>
          </motion.div>
        )}
        {logitsHash && !hashesMatch && (
          <motion.div
            key="diverge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.22em] text-accent"
          >
            <span className="inline-block h-[10px] w-[10px] bg-accent" aria-hidden />
            <span>diverged · floating-point in WASM threads</span>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="font-serif italic text-[12px] text-ink/55">
        Computed via{' '}
        <span className="not-italic font-mono text-[11px] text-ink">
          crypto.subtle.digest('SHA-256', …)
        </span>
        .
      </p>
    </div>
  )
}

function HashBlock({ label, value }: { label: string; value: string | null }) {
  // Type-in animation on hash change
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!value) {
      setShown('')
      return
    }
    let cancelled = false
    setShown('')
    let i = 0
    const tick = () => {
      if (cancelled) return
      i = Math.min(i + 4, value.length)
      setShown(value.slice(0, i))
      if (i < value.length) {
        setTimeout(tick, 10)
      }
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="border border-ink/30 bg-paper p-4">
      <div className="font-sans text-[10px] uppercase tracking-[0.22em] text-ink/55">
        {label}
      </div>
      <div className="mt-2 font-mono text-[11px] break-all leading-relaxed text-ink min-h-[40px]">
        {value ? (
          <>
            {shown}
            {shown.length < value.length && (
              <span className="inline-block w-[6px] h-[12px] bg-ink/40 align-middle ml-0.5 animate-pulse" />
            )}
          </>
        ) : (
          <span className="text-ink/40">—</span>
        )}
      </div>
    </div>
  )
}

// ---------- §VII Devtools ----------

function DevtoolsPanel({
  artifacts,
  text,
  loaded,
}: {
  artifacts: InferenceArtifacts | null
  text: string
  loaded: LoadedRuntime | null
}) {
  const truncatedInput =
    text.length > 48 ? `${text.slice(0, 45)}...` : text
  const reply = artifacts
    ? `{ label: "${artifacts.argmaxLabel}", probs: [${artifacts.probs.map((p) => p.toFixed(3)).join(', ')}], logits: [${artifacts.logits.map((l) => l.toFixed(3)).join(', ')}], tokens: [${artifacts.tokenStrings.length}] }`
    : '// run forward pass to populate'

  const cfgReply = loaded
    ? `{ model: "${MODEL_ID.split('/')[1]}", layers: ${loaded.config.numLayers}, heads: ${loaded.config.numHeads}, hidden: ${loaded.config.hiddenDim} }`
    : '// load model to populate'

  const lines: Array<['>' | '<', string]> = [
    ['>', `await window.tbgInfer("${truncatedInput}")`],
    ['<', reply],
    ['>', 'window.tbgConfig'],
    ['<', cfgReply],
  ]

  const globals: Array<[string, string]> = [
    ['window.tbgModel', 'AutoModelForSequenceClassification instance'],
    ['window.tbgTokenizer', 'AutoTokenizer instance — call as a function'],
    ['window.tbgConfig', 'parsed config.json (layers, heads, hidden, vocab)'],
    ['window.tbgInfer(text)', 'runs the full forward pass and returns artifacts'],
  ]

  return (
    <div className="space-y-4">
      <div className="border-2 border-ink bg-ink text-paper-cream p-5 font-mono text-[12px] leading-[1.7]">
        <div className="flex items-center justify-between mb-3 font-sans text-[10px] uppercase tracking-[0.22em] text-paper-cream/60">
          <span>devtools · console</span>
          <span>{artifacts ? 'live' : 'idle'}</span>
        </div>
        {lines.map(([sigil, txt], i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className={`w-3 ${sigil === '>' ? 'text-accent' : 'text-paper-cream/40'}`}>
              {sigil}
            </span>
            <span
              className={
                sigil === '>'
                  ? 'text-paper-cream break-all'
                  : 'text-paper-cream/70 break-all'
              }
            >
              {txt}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {globals.map(([name, desc]) => (
          <div key={name} className="border border-ink/30 p-3 bg-paper">
            <div className="font-mono text-[12px] text-ink break-all">{name}</div>
            <div className="mt-1 font-serif italic text-[12px] text-ink/55 leading-snug">
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
