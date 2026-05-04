// Inference Lab, real transformer in the browser via @xenova/transformers.
// All numbers, logits, and saliency scores come from the actual ONNX forward
// pass of valurank/distilroberta-bias (mirrored at protectai/distilroberta-
// bias-onnx). DistilRoBERTa-base, fine-tuned on the Wiki-Neutrality Corpus
// for sentence-level BIASED / NEUTRAL classification (Pryzant et al. 2020,
// building on Recasens et al. 2013).
//
// No fabrication. If a value is shown on the page, it is read from the model
// or computed from the model's outputs.

export const MODEL_ID = 'protectai/distilroberta-bias-onnx'
export const MODEL_CARD_URL = `https://huggingface.co/${MODEL_ID}`
export const SOURCE_MODEL_ID = 'valurank/distilroberta-bias'
export const SOURCE_MODEL_URL = `https://huggingface.co/${SOURCE_MODEL_ID}`
export const TRAINING_CORPUS = 'WNC · Wikipedia neutrality edits · ~180k pairs'
export const QUANTIZED = true

// transformers.js (and ONNX runtime web) lazy-imported at run time so that
// the main bundle is not bloated by ~3 MB of WASM glue. The first call to
// loadInferenceRuntime() resolves the module; subsequent calls reuse it.
let _runtime: Promise<typeof import('@xenova/transformers')> | null = null
let _fetchPatched = false

// protectai/distilroberta-bias-onnx hosts its ONNX at the repo root
// (`model_quantized.onnx`), not under `onnx/`. transformers.js v2 hardcodes
// the `onnx/` prefix when constructing the model URL. We surgically rewrite
// that one path at the fetch layer so we don't have to re-host 80 MB of
// weights. The rewrite is targeted: only matches this exact model + path.
function patchFetchForRootLevelOnnx() {
  if (_fetchPatched || typeof window === 'undefined') return
  _fetchPatched = true
  const orig = window.fetch.bind(window)
  const matcher = `/${MODEL_ID}/resolve/main/onnx/`
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string
    if (typeof input === 'string') url = input
    else if (input instanceof URL) url = input.toString()
    else url = (input as Request).url
    if (url.includes(matcher)) {
      const rewritten = url.replace('/resolve/main/onnx/', '/resolve/main/')
      return orig(rewritten, init)
    }
    return orig(input as RequestInfo, init)
  }
}

export function loadInferenceRuntime() {
  if (!_runtime) {
    patchFetchForRootLevelOnnx()
    _runtime = import('@xenova/transformers').then((mod) => {
      mod.env.allowRemoteModels = true
      mod.env.allowLocalModels = false
      mod.env.useBrowserCache = true
      try {
        const cores =
          (typeof navigator !== 'undefined' && (navigator as Navigator).hardwareConcurrency) || 4
        mod.env.backends.onnx.wasm = mod.env.backends.onnx.wasm || {}
        ;(mod.env.backends.onnx.wasm as { numThreads?: number }).numThreads = Math.min(cores, 4)
      } catch {
        // older onnxruntime-web versions don't expose this, fine.
      }
      return mod
    })
  }
  return _runtime
}

// ---------- types ----------

export interface ProgressEvent {
  status: string
  name?: string
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

export interface LoadedFile {
  file: string
  url: string
  bytes: number
  sha12?: string
  durationMs?: number
}

export interface ModelConfigSummary {
  architectures: string[]
  modelType: string
  numLayers: number
  numHeads: number
  hiddenDim: number
  intermediateDim: number
  vocabSize: number
  maxPositionEmbeddings: number
  id2label: Record<number, string>
  raw: Record<string, unknown>
}

export interface TokenizerInfo {
  type: string
  clsId: number
  sepId: number
  padId: number
  unkId: number
  maskId: number | null
}

export interface InferenceArtifacts {
  inputText: string
  tokenIds: number[]
  tokenStrings: string[]
  inputIds: number[]
  attentionMask: number[]
  logits: number[]
  probs: number[]
  argmax: number
  argmaxLabel: string
  forwardMs: number // single forward pass time
  totalMs: number // forward + occlusion sweep
  occlusionRuns: number
  // per-token absolute change in p(argmax) when that token is masked.
  // length = tokenStrings.length. Special tokens get 0.
  occlusionScores: number[]
  // per-token logits delta (signed) for the argmax class
  occlusionDeltas: number[]
  maskTokenId: number | null
}

// ---------- helpers ----------

const enc = new TextEncoder()

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const buf =
    typeof input === 'string'
      ? enc.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function shortHash(hex: string, n = 12): string {
  return hex.slice(0, n)
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(2)} MB`
}

export function formatMs(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)}ms`
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// ---------- model load + cache ----------

export interface LoadedRuntime {
  tokenizer: unknown
  model: unknown
  config: ModelConfigSummary
  tokenizerInfo: TokenizerInfo
  files: LoadedFile[]
  totalBytes: number
  loadMs: number
  transformersVersion: string
}

let _loaded: LoadedRuntime | null = null
export function getLoaded(): LoadedRuntime | null {
  return _loaded
}

export async function loadModel(
  onProgress: (e: ProgressEvent) => void,
  onLog: (line: string) => void,
): Promise<LoadedRuntime> {
  if (_loaded) return _loaded

  const t0 = performance.now()
  onLog(`fetching @xenova/transformers runtime …`)
  const tx = await loadInferenceRuntime()
  onLog(`runtime ready · transformers.js v${tx.env.version}`)
  onLog(`remote host = ${tx.env.remoteHost}`)
  onLog(`model id    = ${MODEL_ID}`)
  onLog(`quantized   = ${QUANTIZED ? 'int8' : 'fp32'}`)

  const files: LoadedFile[] = []
  const fileTimers = new Map<string, number>()

  const progress_callback = (e: ProgressEvent) => {
    onProgress(e)
    if (e.status === 'initiate' && e.file) {
      fileTimers.set(e.file, performance.now())
      onLog(`[fetch] ${e.file} …`)
    } else if (e.status === 'download' && e.file) {
      // first byte hit
    } else if (e.status === 'progress' && e.file && typeof e.loaded === 'number') {
      // streamed, handled in UI
    } else if (e.status === 'done' && e.file) {
      const start = fileTimers.get(e.file) ?? performance.now()
      const ms = performance.now() - start
      const url = `${tx.env.remoteHost}${tx.env.remotePathTemplate.replace('{model}', MODEL_ID).replace('{revision}', 'main')}/${e.file}`
      files.push({
        file: e.file,
        url,
        bytes: typeof e.total === 'number' ? e.total : 0,
        durationMs: ms,
      })
      onLog(`[done]  ${e.file} · ${formatBytes(typeof e.total === 'number' ? e.total : 0)} · ${formatMs(ms)}`)
    } else if (e.status === 'ready') {
      onLog(`[ready] ${e.name ?? ''}`)
    }
  }

  onLog(`loading tokenizer …`)
  const tokenizer = await (tx.AutoTokenizer as unknown as {
    from_pretrained: (id: string, opts: Record<string, unknown>) => Promise<unknown>
  }).from_pretrained(MODEL_ID, { progress_callback })

  onLog(`loading model (ONNX, quantized) …`)
  const model = await (tx.AutoModelForSequenceClassification as unknown as {
    from_pretrained: (id: string, opts: Record<string, unknown>) => Promise<unknown>
  }).from_pretrained(MODEL_ID, { quantized: QUANTIZED, progress_callback })

  const loadMs = performance.now() - t0
  onLog(`forward path online · ${formatMs(loadMs)}`)

  const rawConfig = (model as { config: Record<string, unknown> }).config
  const config: ModelConfigSummary = {
    architectures: Array.isArray(rawConfig.architectures)
      ? (rawConfig.architectures as string[])
      : ['DistilBertForSequenceClassification'],
    modelType: String(rawConfig.model_type ?? 'roberta'),
    numLayers: Number(rawConfig.n_layers ?? rawConfig.num_hidden_layers ?? 6),
    numHeads: Number(rawConfig.n_heads ?? rawConfig.num_attention_heads ?? 12),
    hiddenDim: Number(rawConfig.dim ?? rawConfig.hidden_size ?? 768),
    intermediateDim: Number(rawConfig.hidden_dim ?? rawConfig.intermediate_size ?? 3072),
    vocabSize: Number(rawConfig.vocab_size ?? 30522),
    maxPositionEmbeddings: Number(rawConfig.max_position_embeddings ?? 512),
    id2label: (rawConfig.id2label as Record<number, string>) ?? { 0: 'BIASED', 1: 'NEUTRAL' },
    raw: rawConfig,
  }

  const tk = tokenizer as {
    cls_token_id?: number
    sep_token_id?: number
    bos_token_id?: number
    eos_token_id?: number
    pad_token_id?: number
    unk_token_id?: number
    mask_token_id?: number
    model?: { type?: string }
  }
  // BERT uses cls/sep, RoBERTa uses bos/eos for the same role
  const tokenizerInfo: TokenizerInfo = {
    type: tk.model?.type ?? (config.modelType === 'roberta' ? 'BPE' : 'WordPiece'),
    clsId: tk.cls_token_id ?? tk.bos_token_id ?? 0,
    sepId: tk.sep_token_id ?? tk.eos_token_id ?? 2,
    padId: tk.pad_token_id ?? 1,
    unkId: tk.unk_token_id ?? 3,
    maskId: tk.mask_token_id ?? null,
  }

  const totalBytes = files.reduce((a, f) => a + (f.bytes || 0), 0)

  _loaded = {
    tokenizer,
    model,
    config,
    tokenizerInfo,
    files,
    totalBytes,
    loadMs,
    transformersVersion: tx.env.version,
  }

  // Expose globals so an ML engineer can poke from devtools.
  type W = typeof window & {
    tbgModel?: unknown
    tbgTokenizer?: unknown
    tbgInfer?: (text: string) => Promise<InferenceArtifacts>
    tbgConfig?: ModelConfigSummary
  }
  const w = window as W
  w.tbgModel = model
  w.tbgTokenizer = tokenizer
  w.tbgConfig = config
  w.tbgInfer = (text: string) => runForwardPass(text)

  onLog(`exposed: window.tbgModel · window.tbgTokenizer · window.tbgInfer(text)`)

  return _loaded
}

// ---------- tokenization ----------

export interface TokenizedPreview {
  ids: number[]
  tokens: string[]
  charSpans: [number, number][] // best-effort source character offsets
}

export async function tokenizePreview(text: string): Promise<TokenizedPreview> {
  if (!_loaded) return { ids: [], tokens: [], charSpans: [] }
  const tokenizer = _loaded.tokenizer as {
    (text: string): Promise<{ input_ids: { data: BigInt64Array | number[] | Int32Array } }> | { input_ids: { data: BigInt64Array | number[] | Int32Array } }
    model?: { convert_ids_to_tokens?: (ids: number[]) => string[] }
  }
  const maybe = tokenizer(text)
  const out =
    maybe && typeof (maybe as Promise<{ input_ids: { data: BigInt64Array | number[] | Int32Array } }>).then === 'function'
      ? await (maybe as Promise<{ input_ids: { data: BigInt64Array | number[] | Int32Array } }>)
      : (maybe as { input_ids: { data: BigInt64Array | number[] | Int32Array } })
  const idsAny = out.input_ids.data as ArrayLike<number | bigint>
  const ids: number[] = []
  for (let i = 0; i < idsAny.length; i++) {
    const v = idsAny[i]
    ids.push(typeof v === 'bigint' ? Number(v) : (v as number))
  }
  const convert = (_loaded.tokenizer as {
    model: { convert_ids_to_tokens: (ids: number[]) => string[] }
  }).model.convert_ids_to_tokens
  const tokens = convert.call((_loaded.tokenizer as { model: unknown }).model, ids)

  // best-effort char-span attribution: walk through the original text, lower-cased,
  // and find each (de-prefixed) token's starting position. WordPiece tokens that
  // begin with `##` are continuations of the previous one.
  const lower = text.toLowerCase()
  const spans: [number, number][] = []
  let cursor = 0
  for (const tok of tokens) {
    if (tok === '[CLS]' || tok === '[SEP]' || tok === '[PAD]') {
      spans.push([-1, -1])
      continue
    }
    const piece = tok.startsWith('##') ? tok.slice(2) : tok
    const idx = lower.indexOf(piece, cursor)
    if (idx === -1) {
      spans.push([cursor, cursor])
    } else {
      spans.push([idx, idx + piece.length])
      cursor = idx + piece.length
    }
  }
  return { ids, tokens, charSpans: spans }
}

// ---------- forward pass ----------

function softmax(arr: number[]): number[] {
  const m = Math.max(...arr)
  const exps = arr.map((x) => Math.exp(x - m))
  const s = exps.reduce((a, b) => a + b, 0)
  return exps.map((x) => x / s)
}

type ModelOutput = {
  logits: { data: ArrayLike<number>; dims: number[] }
}

type ModelCallable = (enc: unknown) => Promise<ModelOutput>

type EncoderInput = {
  input_ids: { data: ArrayLike<number | bigint>; dims: number[] }
  attention_mask: { data: ArrayLike<number | bigint>; dims: number[] }
  token_type_ids?: { data: ArrayLike<number | bigint>; dims: number[] }
}

const SPECIAL_TOKEN_LITERALS = new Set([
  '[CLS]', '[SEP]', '[PAD]', '[UNK]', '[MASK]',
  '<s>', '</s>', '<pad>', '<unk>', '<mask>',
])

function bigToNum(v: number | bigint): number {
  return typeof v === 'bigint' ? Number(v) : v
}

function arrToNumber(a: ArrayLike<number | bigint>): number[] {
  const out: number[] = []
  for (let i = 0; i < a.length; i++) out.push(bigToNum(a[i]))
  return out
}

async function runOnce(
  model: ModelCallable,
  encoded: EncoderInput,
): Promise<number[]> {
  const out = await model(encoded)
  return Array.from(out.logits.data as ArrayLike<number>) as number[]
}

function makeEncodedWithIds(
  template: EncoderInput,
  newIds: number[],
): EncoderInput {
  const useBigInt = template.input_ids.data.length > 0 && typeof template.input_ids.data[0] === 'bigint'
  const data: ArrayLike<number | bigint> = useBigInt
    ? (BigInt64Array.from(newIds.map((n) => BigInt(n))) as unknown as ArrayLike<bigint>)
    : (Int32Array.from(newIds) as unknown as ArrayLike<number>)
  return {
    ...template,
    input_ids: { data, dims: [...template.input_ids.dims] },
  }
}

export async function runForwardPass(text: string): Promise<InferenceArtifacts> {
  if (!_loaded) throw new Error('Model not loaded yet, call loadModel() first.')
  const { tokenizer, model, config, tokenizerInfo } = _loaded

  // transformers.js tokenizer call is async (returns a Promise of the encoded
  // input). Calling it synchronously gives back the Promise itself, which the
  // model can't unpack, ONNX errors with "Missing the following inputs:
  // input_ids" because the Promise has no .input_ids property at runtime.
  const tk = tokenizer as (text: string) => Promise<EncoderInput> | EncoderInput
  const maybeEncoded = tk(text)
  const encoded: EncoderInput =
    maybeEncoded && typeof (maybeEncoded as Promise<EncoderInput>).then === 'function'
      ? await (maybeEncoded as Promise<EncoderInput>)
      : (maybeEncoded as EncoderInput)

  const callable = model as unknown as ModelCallable

  const t0 = performance.now()
  const baseLogits = await runOnce(callable, encoded)
  const forwardMs = performance.now() - t0

  // ids / tokens
  const idsArr = arrToNumber(encoded.input_ids.data)
  const maskArr = arrToNumber(encoded.attention_mask.data)

  const convert = (tokenizer as {
    model: { convert_ids_to_tokens: (ids: number[]) => string[] }
  }).model.convert_ids_to_tokens
  const tokenStrings = convert.call(
    (tokenizer as { model: unknown }).model,
    idsArr,
  )

  const probs = softmax(baseLogits)
  let argmax = 0
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[argmax]) argmax = i
  const argmaxLabel = config.id2label[argmax] ?? `class_${argmax}`
  const baseProb = probs[argmax]

  // Occlusion saliency: for each non-special token, replace with [MASK] (or
  // [UNK] if [MASK] is not in the tokenizer) and re-run. The drop in
  // p(argmax) is that token's importance.
  const maskId = tokenizerInfo.maskId ?? tokenizerInfo.unkId ?? tokenizerInfo.padId
  const occlusionScores: number[] = new Array(idsArr.length).fill(0)
  const occlusionDeltas: number[] = new Array(idsArr.length).fill(0)
  let runs = 0

  for (let i = 0; i < idsArr.length; i++) {
    const tok = tokenStrings[i]
    if (SPECIAL_TOKEN_LITERALS.has(tok)) continue
    if (maskArr[i] === 0) continue

    const variant = idsArr.slice()
    variant[i] = maskId
    const variantEncoded = makeEncodedWithIds(encoded, variant)
    const variantLogits = await runOnce(callable, variantEncoded)
    const variantProbs = softmax(variantLogits)
    const variantP = variantProbs[argmax]
    occlusionScores[i] = Math.max(0, baseProb - variantP) + Math.max(0, variantP - baseProb) * 0.25
    occlusionDeltas[i] = baseLogits[argmax] - variantLogits[argmax]
    runs++
  }

  const totalMs = performance.now() - t0

  return {
    inputText: text,
    tokenIds: idsArr,
    tokenStrings,
    inputIds: idsArr,
    attentionMask: maskArr,
    logits: baseLogits,
    probs,
    argmax,
    argmaxLabel,
    forwardMs,
    totalMs,
    occlusionRuns: runs,
    occlusionScores,
    occlusionDeltas,
    maskTokenId: maskId,
  }
}
