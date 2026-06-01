// Strip outlet identifiers from article titles before showing them in games
// where the player is supposed to identify the source (Guess the Source) or
// guess the bias without an outlet hint (Bias Detective). Real-world headlines
// often include the masthead — "Fox News: ...", "... | CNN", "... - The New
// York Times" — which trivially gives the answer away.
//
// Strategy:
//  1. Build alias list for the known source (e.g. "foxnews.com" → ["foxnews",
//     "fox news", "fox"]).
//  2. Strip leading/trailing "alias :", "alias -", "alias |", "alias —",
//     "alias --", and the reverse forms.
//  3. Also strip a hardcoded list of common outlet names regardless of source,
//     so cross-outlet leaks (e.g. a Reuters wire republished by another paper)
//     don't sneak through.

const COMMON_OUTLET_ALIASES = [
  // Network / cable
  'fox news', 'foxnews', 'fox',
  'cnn',
  'msnbc',
  'nbc news', 'nbc',
  'abc news', 'abc',
  'cbs news', 'cbs',
  'bbc news', 'bbc',
  // Wires
  'reuters',
  'associated press', 'ap news', 'the associated press',
  'bloomberg',
  'agence france-presse', 'afp',
  // Papers
  'the new york times', 'new york times', 'nyt', 'ny times',
  'the washington post', 'washington post', 'wapo',
  'the wall street journal', 'wall street journal', 'wsj',
  'the guardian', 'guardian',
  'usa today',
  'la times', 'los angeles times', 'the los angeles times',
  'chicago tribune',
  'new york post', 'ny post', 'nypost',
  'the washington times', 'washington times',
  'the washington examiner', 'washington examiner',
  'the boston globe', 'boston globe',
  'the daily telegraph', 'the telegraph', 'telegraph',
  'financial times', 'ft',
  // Magazines / digital
  'the atlantic', 'atlantic',
  'the new yorker', 'new yorker',
  'politico',
  'the hill',
  'axios',
  'vox',
  'slate',
  'salon',
  'mother jones',
  'the intercept', 'intercept',
  'huffpost', 'huffington post',
  'daily beast', 'the daily beast',
  'breitbart',
  'national review',
  'the daily wire', 'daily wire',
  'daily caller', 'the daily caller',
  'the federalist', 'federalist',
  'townhall',
  'newsmax',
  'oan', 'one america news',
  'the epoch times', 'epoch times',
  'pbs newshour', 'pbs',
  'npr',
  'the economist', 'economist',
  'forbes',
  'business insider', 'insider',
  'cnbc',
  'yahoo news', 'yahoo',
  'msn news', 'msn',
  'gateway pundit', 'the gateway pundit',
  'the blaze',
  'jacobin',
]

function aliasesForSource(source: string | undefined | null): string[] {
  if (!source || typeof source !== 'string') return []
  const cleaned = source.toLowerCase().replace(/\.(com|org|net|news|co\.uk|co)$/i, '')
  const tokens = cleaned.split(/[^a-z0-9]+/).filter(Boolean)
  const set = new Set<string>()
  set.add(cleaned)
  if (tokens.length > 0) {
    set.add(tokens.join(' '))
    set.add(tokens.join(''))
    if (tokens.length >= 2) set.add(tokens[0]) // e.g. "fox" from "foxnews"
    set.add(tokens[tokens.length - 1]) // e.g. "post" from "washington post"
  }
  return Array.from(set).filter((s) => s.length >= 3)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Strip "alias : " or "alias - " or "alias | " etc. from the start, and the
// mirror forms from the end. Separators tried: `:`, `-`, `–`, `—`, `|`, `--`.
const SEP = `[\\s]*[:|\\-–—]+[\\s]*`
const SEP_END = `[\\s]+[|\\-–—]+[\\s]*`

function stripAlias(title: string, alias: string): string {
  if (!alias) return title
  const e = escapeRegex(alias)
  // Leading: "ALIAS: rest" / "ALIAS - rest" / "ALIAS | rest"
  let out = title.replace(new RegExp(`^${e}${SEP}`, 'i'), '').trim()
  // Trailing: "rest | ALIAS" / "rest - ALIAS" / "rest — ALIAS"
  out = out.replace(new RegExp(`${SEP_END}${e}\\s*$`, 'i'), '').trim()
  // Parenthesized: "rest (ALIAS)" at end
  out = out.replace(new RegExp(`[\\s]*[\\(\\[]${e}[\\)\\]]\\s*$`, 'i'), '').trim()
  return out
}

// Redact in running prose: replace whole-word occurrences of the source's
// own aliases with a neutral placeholder. We deliberately do NOT use the full
// common-outlet list here — that would falsely mangle articles that quote
// other outlets in their reporting ("the Times reported that..."). The body
// only needs the specific source's self-references masked.
export function redactSourceFromBody(
  body: string | null | undefined,
  source?: string | null,
): string {
  if (!body) return ''
  const aliases = aliasesForSource(source).sort((a, b) => b.length - a.length)
  let out = body
  for (const alias of aliases) {
    if (alias.length < 4) continue // skip 3-letter tokens to avoid false hits
    const e = escapeRegex(alias)
    out = out.replace(new RegExp(`\\b${e}\\b`, 'gi'), '[outlet]')
  }
  return out
}

export function redactSourceFromTitle(
  title: string | null | undefined,
  source?: string | null,
): string {
  if (!title) return ''
  let out = title.trim()
  const aliases = new Set<string>([
    ...aliasesForSource(source),
    ...COMMON_OUTLET_ALIASES,
  ])
  // Sort longest-first so "the new york times" is tried before "times".
  const sorted = Array.from(aliases).sort((a, b) => b.length - a.length)
  for (const alias of sorted) {
    const next = stripAlias(out, alias)
    if (next !== out && next.length >= 8) {
      // Only accept the strip if a non-trivial title remains. A 5-char residue
      // ("Said") is worse than the original with the masthead.
      out = next
    }
  }
  return out || title
}
