# Handoff: TheBiasGraph

## Overview

TheBiasGraph is a personal-project web app that reads news articles for **comparison bias** — how the same factual story is framed differently across outlets. The user can:

1. **Search a topic.** The site finds articles and plots each one across the political spectrum (the hero experience).
2. **Analyze a single article** by pasting its body or URL.
3. **Play four games** against the model.
4. **Inspect the model itself** in an Inference Lab page where a real transformer (DistilBERT) is downloaded into the browser, with tokenizer, attention, logits, and SHA-256 hashes all visible.
5. **Read the methodology** — a long-form research-paper page documenting the model's architecture, training, and evaluation.

This handoff covers three pages:

- `/` — Landing
- `/inference-lab` — Inference Lab
- `/how-i-built-this` — Methodology

## About the Design Files

Files in `source/` are **design references created as React/Babel HTML prototypes**, presented inside a pan-zoom design canvas. They are NOT production code to copy directly.

The task is to **recreate these designs in the target codebase's existing environment** (Next.js / React Router / SvelteKit / etc.) using its established patterns, routing, and styling conventions. If no codebase exists yet, Next.js + Tailwind is recommended — it maps 1:1 to the prototype's idioms.

Tailwind utility classes in the prototype are intentional and should survive the port. The exact spacing/typography/color tokens defined below are part of the system and must be preserved.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, layout, and interaction structure. Pixel-perfect recreation expected.

The visual identity is **editorial broadsheet** — Playfair Display for display type, Source Serif 4 for body, Inter for UI labels and microcopy, JetBrains Mono / ui-monospace for numerics and code. Cream paper background, ink-black text, oxblood-red accent, hairline rules everywhere.

---

## Design tokens

### Colors

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#111111` | All primary text, rules, dark surfaces |
| `paper` | `#FAFAF7` | Slightly cooler "white" — input fills, card surfaces |
| `paper-cream` | `#F4EDDF` | Page background |
| `paper-warm` | `#EFE6D2` (used at 30% opacity for the closing-note section) |
| `accent` | `#B91C1C` | Oxblood — used SPARINGLY (loaded-language highlights, attention heatmap, errors, single emphasis labels) |
| `emerald-400/700` | tailwind defaults | "ready" / "match" indicators in the lab |

**Spectrum gradient** (the hero graph): linear-gradient left→right
```
#1d3a8a 0% · #2563eb 18% · #93c5fd 38% · #e7e2d2 50% · #fca5a5 62% · #dc2626 82% · #7f1d1d 100%
```

### Typography

| Role | Family | Notes |
|---|---|---|
| Display (page titles, headlines) | `"Playfair Display"`, weight 900 | letter-spacing −0.045em on the largest sizes, −0.04em otherwise; line-height 0.94–1.0 |
| Body | `"Source Serif 4"`, weight 400/600 | line-height 1.55–1.65 |
| UI labels, kickers, eyebrows | `Inter`, weight 400/500/600 | uppercase + letter-spacing 0.18–0.24em for kickers |
| Numerics, code, hashes, tokens | `ui-monospace, Menlo, monospace` | tabular-nums |

Type scale used:
- Hero headline: **88px / 0.94 / −0.045em**
- Section title: 44–48px / 0.98 / −0.04em
- Subsection title: 30–38px / 1.0 / −0.04em
- Body: 16–20px / 1.55
- Eyebrow / kicker: 11px uppercase / 0.22em

### Spacing

Tailwind defaults. Sections use **py-16 to py-20** (64–80px) at minimum. Hero is **pt-16 pb-12**. Page side gutters are **px-12** (48px). Major content blocks use a **12-col grid with gap-10** (40px) or **gap-8** (32px).

### Borders & rules

- Hairlines: `border-ink/15` (page section dividers), `border-ink/20` (header sub-rules), `border-ink/30` (card frames)
- Heavy rules: `border-t-2 border-ink` (masthead top, hero graph top)
- Card frames: `border-2 border-ink` (analyze paste-box) or `border border-ink/30` (most figures)
- No rounded corners on editorial surfaces. Pills/chips use `rounded-full`. Spectrum graph dots use `rounded-full`.

### Shadows

Effectively none. One subtle dot shadow on graph markers: `shadow-[0_1px_0_rgba(0,0,0,0.08)]`.

---

## Shared components / primitives

These exist in `source/shared.jsx`, `source/spectrum.jsx`, and `source/diagrams.jsx`. Port them as standalone components.

### `<SpectrumGraph query height />`
The hero of the site. A horizontal saturated blue→red bias-axis bar with article markers floating above it.
- Plot area is `height − 120px`
- Article markers: 10×10px (or 8×8 compact) cream-fill ink-stroke circle + 9px Inter uppercase 3-letter outlet code beneath
- Gradient bar: 14px tall, full-width, with tick marks at 0/25/50/75/100%
- Axis labels below: "← Far left · Lean left · Center · Lean right · Far right →"
- Top-left overlay: "{count} articles · "{query}" · past 24 hours"
- Top-right overlay: aggregate stats (avg / spread / outlets) — Playfair number + Inter label
- Sample data: see `SAMPLE_ARTICLES` in `spectrum.jsx`

### `<TopicChips chips size />`
A row of italic Source Serif chips inside `border border-ink/30 rounded-full`, prefixed with an Inter uppercase "TRY" eyebrow. Hover: invert (bg-ink, text-paper-cream).

### `<ArchitectureFigure />`
SVG diagram for the methodology page: tokens box → arrow → solid black ENCODER block ("DeBERTa-v3 / 12 layer · 12 head · 768d / 139M params · shared / [CLS] pooled output") → fan-out lines to 8 outlined head boxes labeled FACT/ECON/SOC/EST/SENS/LOAD/DIV/HB. A dashed branch beneath labels the gradient-reversed adversarial outlet head.

### `<DatasetFunnel />`, `<TrainingLossChart />`, `<EvalTable />`, `<AttentionRolloutFigure />`, `<LossEquation />`
See `source/diagrams.jsx` — six self-contained figures used by the methodology page. Each is wrapped in a `border border-ink/30 bg-paper p-5` card with a 10px Inter uppercase "Figure N · …" eyebrow.

### Lab notebook primitives
See `source/inference-lab.jsx`. Six section components (`LabModelCard`, `LabLoad`, `LabTokenizer`, `LabForwardPass`, `LabSaliency`, `LabHashes`, `LabDevtools`).

---

## Page 1 — Landing (`/`)

**File:** `source/direction-e.jsx`
**Component:** `DirectionE_Landing`

### Layout principle
Centered nameplate, but the **axis breaks below the fold**. No section after the masthead is symmetric — every one uses an asymmetric grid (7/5, 2/5/5, 3/2/2/2/2/1, 1/7/4) so the page reads as a real front page rather than a stack of centered blocks.

### Sections, in order

**1. Masthead** (the only symmetric element)
- 2px ink top rule
- `grid grid-cols-12 items-end` with: col-3 left "Vol. II · No. v2.0.0" / col-6 centered nameplate ("TheBiasGraph" 52px Playfair black + italic tagline "A reading instrument for comparison bias") / col-3 right "Tuesday · May 2026"
- Hairline bottom rule
- Nav strip: `Search · Analyze · Play · Lab · Methodology` left, `By NeuralBias` right, all 11px Inter uppercase 0.2em

**2. Hero** (asymmetric 7/5)
- Left col-7: "Today's reading · No. 1" eyebrow + 88px headline "The same story, / read every which way."
- Right col-5 (with `border-l border-ink/20 pl-10`): italic abstract describing the search experience + 2px ink-bordered search panel ("Topic" / "student loans" italic / black "Search →" button) + TopicChips
- **Below**: full-width SpectrumGraph (height 400) wrapped in `border-t-2 border-b border-ink py-10`

**3. Paste secondary** (2/5/5)
- col-2 vertical kicker "Have one in mind?"
- col-5 headline "Or analyze a single article." + italic body
- col-5 paste card: 2px ink border, "Paste text" / "From URL" tabs, italic placeholder text, "Analyze →" button bottom-right

**4. Play strip** (3/2/2/2/2/1)
- col-3 title block: "Department" eyebrow + "Play against the model." headline + italic intro
- Four col-2 game items, each `border-l border-ink/15 pl-5` with: 0N counter, game name (Playfair 22px), one-line description, "Play" link
- col-1 right-aligned page-fold marker "/play"

Games:
1. Bias Detective — Place it on the spectrum.
2. Guess the Source — Identify the outlet.
3. Compare Two Takes — Pick the more biased.
4. Headline Rewrite — Neutralize a loaded line.

**5. The Note** (1/7/4, on a `bg-paper-warm/30` background)
- col-1 vertical "The Note" label, rotated -90°
- col-7 body: `border-l-2 border-ink pl-8`, drop-cap "I", explanation of the personal project + comparison-bias model + 1.24M cross-outlet pairs. Two CTAs: "Open the Inference Lab →" (primary, ink underline) and "Read the methodology →" (secondary)
- col-4 right rail: `border border-ink/30 p-5 bg-paper` aside titled "By the numbers" with 5 key/value rows: DeBERTa-v3 base / 139M · Cross-outlet pairs / 1.24M · Outlets covered / 312 · Held-out concordance / 94.1% · Built by / one engineer

**6. Footer**
- "TheBiasGraph · v2.0.0" left, "By NeuralBias · LinkedIn" right

---

## Page 2 — Inference Lab (`/inference-lab`)

**File:** `source/inference-lab.jsx`
**Component:** `InferenceLabPage`

### Purpose
The whole site claims "custom neural network." This page proves it. It downloads a real DistilBERT model (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`, ~47MB, 66M params) into the browser via `@xenova/transformers`, exposes globals (`window.tbgModel`, `window.tbgTokenizer`, `window.tbgConfig`, `window.tbgInfer`), and shows every step.

### Real backend behavior expected (when ported)
1. **Load model** button → `pipeline('text-classification', 'Xenova/distilbert-...')` with `progress_callback` streaming bytes. Cache lands in IndexedDB automatically (transformers.js does this).
2. **Tokenizer** — accept user text, run `tokenizer(text)`, render each token + its real integer ID. [CLS]=101, [SEP]=102.
3. **Forward pass** — `model(inputs, { output_attentions: true, output_hidden_states: true })`. Measure with `performance.now()`. Render hidden-state shapes per layer, attention heatmap (with layer/head dropdowns), [CLS] pooled embedding sparkline, raw logits + softmax + argmax.
4. **Saliency** — implement attention rollout (Abnar & Zuidema 2020): multiply attention matrices across all 6 layers, take the [CLS] row, render input text with each word's bg-opacity proportional to its score.
5. **Hashes** — `crypto.subtle.digest('SHA-256', ...)` of input string and JSON-stringified logits. Re-run button confirms hashes match.
6. **Devtools** — assign `window.tbgModel`, `window.tbgTokenizer`, `window.tbgConfig`, `window.tbgInfer = async (text) => { ... }`.

### Layout (sectioned I–VII, mirrors `MethodologyPreview`'s editorial layout)

- **Masthead** — same pattern as landing (3/6/3) but with: left "TheBiasGraph", center "The Inference Lab" + italic "A real transformer · running on your machine", right "Notebook · No. 1"
- **Lede (7/5)** — left col-7: "An exhibit, not a demo" eyebrow + 80px headline "The model / shows its work."; right col-5 (border-l): italic abstract + small uppercase note that this is the small DistilBERT companion, production runs DeBERTa-v3 server-side
- **§ I + § II** (7/5) — Model card on left (2px black border, all spec rows), terminal-styled load log on right (black bg, paper-cream text, accent-red kind labels, emerald loaded indicator)
- **§ III Tokenizer** (full-width) — italic input text in a paper-cream box, then a wrap-row of WordPiece chips (each `border border-ink/30 bg-paper`, monospace token + 10px gray ID; brackets in accent red)
- **§ IV Forward pass** (full-width 4/4/4) — left: per-layer hidden-state shapes table; middle: 12×12 attention heatmap built from a CSS grid of accent-red opacity cells, with layer/head selects; right: 256-cell SVG sparkline of [CLS] pooled embedding + logits/softmax/argmax. Top-right: live "wall clock 42.118 ms" readout. Bottom-right: "Re-run" + "Run forward pass →" buttons.
- **§ V + § VI** (7/5) — Saliency heatmap (token chips with red bg-opacity, low→high gradient legend) on left; SHA-256 hash blocks on right with "✓ match · 3 runs"
- **§ VII Devtools** (5/7) — left: "Closing note" + "Don't trust me — run it yourself." encouraging the user to open the console; right: black terminal pane showing real `>` / `<` console session, then a 4-up grid of exposed globals
- **Footer** — "TheBiasGraph · Inference Lab" / "@xenova/transformers · ONNX Runtime Web"

### State the page needs
- `modelLoaded: boolean`
- `loadProgress: { file, bytes, total }[]` (live)
- `tokens: { text, id, charSpan: [start, end] }[]`
- `forwardResult: { hiddenShapes, attention[layer][head], pooledCLS[768], logits[], probs[], label }`
- `selectedLayer: number`, `selectedHead: number`
- `inputHash: string`, `logitsHash: string`, `runs: number`, `hashesMatch: boolean`

---

## Page 3 — Methodology (`/how-i-built-this`)

**File:** `source/methodology-preview.jsx`
**Component:** `MethodologyPreview`

### Purpose
Long-form research-paper-style writeup. The preview in `source/` covers sections **II, IV, V, VI, VII** with full diagrams; the full page should also include **I (Motivation), III (Labeling), VIII (Productionization), IX (Open questions), X (References)** as prose-only sections matching the same column system.

### Layout
- **Masthead** — landing pattern, but with center subtitle "Building TheBiasGraph · a methodology"
- **Title block** (centered, 1× exception to the no-symmetry rule because this IS a paper title page)
- **TOC** — single row with hairlines top + bottom, 12-col grid, 4 columns × 2 rows of section links, each with tabular 0N counter
- **§ II Dataset** (asymmetric 6/6) — drop-cap-led prose left, `<DatasetFunnel />` right
- **§ IV Architecture** (5/7) — prose left, `<ArchitectureFigure />` right (the figure is wider than the prose)
- **§ V Training objective** (7/5) — `<LossEquation />` left, prose right (figure now leads)
- **§ VI Infrastructure** (7/5) — `<TrainingLossChart />` left, prose right (incl. 4× A100 / Lambda Labs / $312 / run name in monospace)
- **§ VII Evaluation** (7/5) — `<EvalTable />` left, `<AttentionRolloutFigure />` + saliency caption right
- **Footer** — references row with arXiv IDs

### Diagrams

| Diagram | Section | What it shows |
|---|---|---|
| Architecture | IV | DeBERTa-v3 encoder → 8 classification heads + dashed adversarial outlet branch |
| Dataset funnel | II | Six-stage funnel from 14.8M raw articles → 1.24M cross-outlet pairs |
| Loss equation | V | Typeset L = L_sup + α·L_cmp + β·L_inv with sub-equations and α=0.40, β=0.05, m=0.15 |
| Training loss | VI | v1 (red dashed, collapses at epoch 1.7) vs v2 (ink solid, descends to 0.211) |
| Eval table | VII | 8 rows × 4 columns: Dimension / F1 / RMSE / Human ceiling |
| Attention rollout | VII | Inline tokens with red bg-opacity proportional to per-token saliency |

---

## Routing the rest of the app

The conversation specced these routes — implement as the codebase demands:

| Route | Purpose |
|---|---|
| `/` | Landing (this handoff) |
| `/search?q=…` | Spectrum view (default) + columns view toggle. Articles auto-found for any topic. |
| `/article/:id` | Single article reader: source/dateline, headline, italic lede, drop-capped body with inline loaded-language highlights, pull quote. Sidebar: "How the model thinks" inference trace, 8-dim radar, linguistic-signals panel, Inference Receipt at bottom. |
| `/analyze` | Paste an article. Two modes: paste text or URL. 5-stage live-inference animation while running, then renders the same layout as `/article/:id`. |
| `/play` | 2×2 grid of game tiles + live best-scores |
| `/play/detective` | Bias Detective — drag clipping onto spectrum, 3-2-1 countdown, 10 rounds, persistent YOU vs NETWORK scoreboard |
| `/play/source` | Guess the Source — clipping with masthead removed, 4 outlet choices |
| `/play/compare` | Compare Two Takes — two articles same story, pick more biased + direction |
| `/play/rewrite` | Headline Rewrite — neutralize loaded headline. 7-line faux progress + 7 sub-scores tick up: bias delta, length similarity, cosine meaning, loaded reduction, NER preservation, hedge penalty, NLI entailment |
| `/inference-lab` | This handoff |
| `/how-i-built-this` | This handoff |
| `/api-status` | Backend health dashboard |

Persistent header: `ModelBadge` ("TheBiasGraph v2 · 10,000hr" pill, opens popover model card on click) + persistent "Analyze →" button.

The four games loosen the editorial restraint: saturated colors, big point-bursts, sound effects, sports-broadcast scorecards. **Marketing surfaces (landing, methodology, lab, search, article) stay editorial and authoritative.**

---

## Assets

No image assets are used in these designs — everything is type, hairlines, SVG diagrams, and CSS gradients. **The methodology page WILL need a personal byline photo for the "By NeuralBias · May 2026" block** (small, square, monochrome) — currently absent; please commission or use a placeholder.

Outlet codes used in `SAMPLE_ARTICLES` (Jacobin → JCB, NYT → NYT, etc.) are 3-letter abbreviations, no logos.

---

## Files in this bundle

```
source/
  TheBiasGraph Landing.html       — design canvas host, fonts, tailwind config
  design-canvas.jsx               — the pan/zoom canvas wrapper (NOT for production)
  shared.jsx                      — Fleuron, ThinDiamond, MiniRadar, SpectrumBar, ArchitectureDiagram, DatelineBar
  spectrum.jsx                    — SAMPLE_ARTICLES, SpectrumGraph, TopicChips
  diagrams.jsx                    — ArchitectureFigure, LossEquation, DatasetFunnel,
                                    TrainingLossChart, EvalTable, AttentionRolloutFigure
  methodology-preview.jsx         — Page 3 (sections II/IV/V/VI/VII)
  inference-lab.jsx               — Page 2 (LabModelCard, LabLoad, LabTokenizer,
                                    LabForwardPass, LabSaliency, LabHashes, LabDevtools, InferenceLabPage)
  direction-e.jsx                 — Page 1 (DirectionE_Landing)
```

The Tailwind theme extension (ink / paper / paper-cream / paper-warm / accent / fontFamily / letterSpacing) lives at the top of `TheBiasGraph Landing.html` — port it into your `tailwind.config.js` verbatim.
