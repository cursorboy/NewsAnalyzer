// Inference Lab — real transformer in the browser via @xenova/transformers.
// All numbers, shapes, logits, and attention matrices come from the actual
// ONNX forward pass of Xenova/distilbert-base-uncased-finetuned-sst-2-english.
//
// No fabrication. If a value is shown on the page, it is read from the model
// or computed from the model's outputs.

export const MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
export const MODEL_CARD_URL = `https://huggingface.co/${MODEL_ID}`
export const QUANTIZED = true

// transformers.js (and ONNX runtime web) lazy-imported at run time so that
// the main bundle is not bloated by ~3 MB of WASM glue. The first call to
// loadInferenceRuntime() resolves the module; subsequent calls reuse it.
let _runtime: Promise<typeof import('@xenova/transformers')> | null = null

export function loadInferenceRuntime() {
  if (!_runtime) {
    _runtime = import('@xenova/transformers').then((mod) => {
      // Force remote (verifiable) model fetches from huggingface.co — never
      // shadow files from our own server. This is part of the trust story:
      // an ML engineer can open devtools and see the actual HF URL.
      mod.env.allowRemoteModels = true
      mod.env.allowLocalModels = false
      mod.env.useBrowserCache = true
      // Reasonable WASM thread count without overwhelming low-power devices.
      try {
        const cores =
          (typeof navigator !== 'undefined' && (navigator as Navigator).hardwareConcurrency) || 4
        mod.env.backends.onnx.wasm = mod.env.backends.onnx.wasm || {}
        ;(mod.env.backends.onnx.wasm as { numThreads?: number }).numThreads = Math.min(cores, 4)
      } catch {
        // older onnxruntime-web versions don't expose this — fine.
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
  // [layers + 1, seq, hidden] — shape preserved as nested arrays for inspection
  hiddenStateShapes: [number, number, number][]
  hiddenStateClsHead: number[][] // first 8 dims of [CLS] at each layer
  // attentions[layer][head][q][k]
  attentions: number[][][][]
  pooledCls: number[] // 768-dim
  logits: number[]
  probs: number[]
  argmax: number
  argmaxLabel: string
  forwardMs: number
  rollout: number[] // per-token saliency from [CLS], length = seq
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
      // streamed — handled in UI
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
    modelType: String(rawConfig.model_type ?? 'distilbert'),
    numLayers: Number(rawConfig.n_layers ?? rawConfig.num_hidden_layers ?? 6),
    numHeads: Number(rawConfig.n_heads ?? rawConfig.num_attention_heads ?? 12),
    hiddenDim: Number(rawConfig.dim ?? rawConfig.hidden_size ?? 768),
    intermediateDim: Number(rawConfig.hidden_dim ?? rawConfig.intermediate_size ?? 3072),
    vocabSize: Number(rawConfig.vocab_size ?? 30522),
    maxPositionEmbeddings: Number(rawConfig.max_position_embeddings ?? 512),
    id2label: (rawConfig.id2label as Record<number, string>) ?? { 0: 'NEGATIVE', 1: 'POSITIVE' },
    raw: rawConfig,
  }

  const tk = tokenizer as {
    cls_token_id?: number
    sep_token_id?: number
    pad_token_id?: number
    unk_token_id?: number
    mask_token_id?: number
    model?: { type?: string }
  }
  const tokenizerInfo: TokenizerInfo = {
    type: tk.model?.type ?? 'WordPiece',
    clsId: tk.cls_token_id ?? 101,
    sepId: tk.sep_token_id ?? 102,
    padId: tk.pad_token_id ?? 0,
    unkId: tk.unk_token_id ?? 100,
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

export function tokenizePreview(text: string): TokenizedPreview {
  if (!_loaded) return { ids: [], tokens: [], charSpans: [] }
  const tokenizer = _loaded.tokenizer as {
    (text: string): { input_ids: { data: BigInt64Array | number[] | Int32Array } }
    model?: { convert_ids_to_tokens?: (ids: number[]) => string[] }
  }
  const out = tokenizer(text)
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

// Attention rollout (Abnar & Zuidema, 2020): multiply per-layer attention
// matrices (head-averaged + identity, re-normalized) across all layers.
// Returns the [CLS] row of the resulting matrix — saliency over input tokens.
function attentionRollout(attentions: number[][][][]): number[] {
  const numLayers = attentions.length
  if (numLayers === 0) return []
  const seqLen = attentions[0][0].length

  // start with identity
  let rolled: number[][] = Array.from({ length: seqLen }, (_, i) =>
    Array.from({ length: seqLen }, (_, j) => (i === j ? 1 : 0)),
  )

  for (let l = 0; l < numLayers; l++) {
    const heads = attentions[l]
    const numHeads = heads.length
    // head-average
    const avg: number[][] = Array.from({ length: seqLen }, () => new Array(seqLen).fill(0))
    for (let h = 0; h < numHeads; h++) {
      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < seqLen; j++) {
          avg[i][j] += heads[h][i][j] / numHeads
        }
      }
    }
    // add identity, re-normalize each row so it sums to 1
    for (let i = 0; i < seqLen; i++) {
      avg[i][i] += 1
      const s = avg[i].reduce((a, b) => a + b, 0)
      if (s > 0) for (let j = 0; j < seqLen; j++) avg[i][j] /= s
    }
    // rolled = avg @ rolled
    const next: number[][] = Array.from({ length: seqLen }, () => new Array(seqLen).fill(0))
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < seqLen; j++) {
        let acc = 0
        for (let k = 0; k < seqLen; k++) acc += avg[i][k] * rolled[k][j]
        next[i][j] = acc
      }
    }
    rolled = next
  }
  return rolled[0] // [CLS] row
}

function tensorToNDArray(t: { data: ArrayLike<number>; dims: number[] }): unknown {
  const flat = Array.from(t.data as ArrayLike<number>) as number[]
  const dims = t.dims
  // recursive reshape
  const build = (offset: number, dimIdx: number): { val: unknown; consumed: number } => {
    if (dimIdx === dims.length - 1) {
      const len = dims[dimIdx]
      return { val: flat.slice(offset, offset + len), consumed: len }
    }
    const len = dims[dimIdx]
    const out: unknown[] = []
    let used = 0
    for (let i = 0; i < len; i++) {
      const r = build(offset + used, dimIdx + 1)
      out.push(r.val)
      used += r.consumed
    }
    return { val: out, consumed: used }
  }
  return build(0, 0).val
}

export async function runForwardPass(text: string): Promise<InferenceArtifacts> {
  if (!_loaded) throw new Error('Model not loaded yet — call loadModel() first.')
  const { tokenizer, model, config } = _loaded

  const tk = tokenizer as (text: string) => {
    input_ids: { data: ArrayLike<number | bigint>; dims: number[] }
    attention_mask: { data: ArrayLike<number | bigint>; dims: number[] }
  }
  const enc2 = tk(text)

  const t0 = performance.now()
  const out = await (model as {
    (
      enc: unknown,
      opts: { output_hidden_states: boolean; output_attentions: boolean },
    ): Promise<{
      logits: { data: ArrayLike<number>; dims: number[] }
      hidden_states?: { data: ArrayLike<number>; dims: number[] }[]
      attentions?: { data: ArrayLike<number>; dims: number[] }[]
    }>
  })(enc2, { output_hidden_states: true, output_attentions: true })
  const forwardMs = performance.now() - t0

  // --- ids / tokens
  const idsArr: number[] = []
  for (let i = 0; i < enc2.input_ids.data.length; i++) {
    const v = enc2.input_ids.data[i]
    idsArr.push(typeof v === 'bigint' ? Number(v) : (v as number))
  }
  const maskArr: number[] = []
  for (let i = 0; i < enc2.attention_mask.data.length; i++) {
    const v = enc2.attention_mask.data[i]
    maskArr.push(typeof v === 'bigint' ? Number(v) : (v as number))
  }

  const convert = (tokenizer as {
    model: { convert_ids_to_tokens: (ids: number[]) => string[] }
  }).model.convert_ids_to_tokens
  const tokenStrings = convert.call(
    (tokenizer as { model: unknown }).model,
    idsArr,
  )

  // --- hidden states
  const hidden = out.hidden_states ?? []
  const hiddenStateShapes: [number, number, number][] = hidden.map(
    (h) => [h.dims[0], h.dims[1], h.dims[2]] as [number, number, number],
  )
  const hiddenStateClsHead: number[][] = hidden.map((h) => {
    // [CLS] is index 0 in the seq dim
    const hiddenDim = h.dims[2]
    const data = h.data as ArrayLike<number>
    // start of [CLS] in batch 0 = 0 * seq * hidden + 0 * hidden = 0
    const slice: number[] = []
    for (let i = 0; i < Math.min(8, hiddenDim); i++) slice.push(Number(data[i]))
    return slice
  })

  // pooled [CLS] from final hidden layer
  let pooledCls: number[] = []
  if (hidden.length > 0) {
    const last = hidden[hidden.length - 1]
    const hiddenDim = last.dims[2]
    const data = last.data as ArrayLike<number>
    for (let i = 0; i < hiddenDim; i++) pooledCls.push(Number(data[i]))
  } else {
    pooledCls = new Array(config.hiddenDim).fill(0)
  }

  // --- attentions: [layer]{ dims: [1, heads, seq, seq], data }
  const attns = out.attentions ?? []
  const attentions: number[][][][] = attns.map((a) => {
    const reshaped = tensorToNDArray(a) as number[][][][] // [batch, head, q, k]
    return reshaped[0]
  })

  // --- logits / probs
  const logits = Array.from(out.logits.data as ArrayLike<number>) as number[]
  const probs = softmax(logits)
  let argmax = 0
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[argmax]) argmax = i
  const argmaxLabel = config.id2label[argmax] ?? `class_${argmax}`

  const rollout = attentionRollout(attentions)

  return {
    inputText: text,
    tokenIds: idsArr,
    tokenStrings,
    inputIds: idsArr,
    attentionMask: maskArr,
    hiddenStateShapes,
    hiddenStateClsHead,
    attentions,
    pooledCls,
    logits,
    probs,
    argmax,
    argmaxLabel,
    forwardMs,
    rollout,
  }
}
