import type { Article, ComparePair, HeadlineRewriteScore, ArticleDetail } from './api'

export const FALLBACK_ARTICLES: Article[] = [
  {
    id: 'fb-1',
    url: 'https://example.com/fb-1',
    title: 'Reckless GOP plan slams working families with deepest cuts in years',
    snippet: 'A devastating Republican spending bill, rammed through on a party-line vote, would gut food assistance and Medicaid for millions, advocates warned.',
    source: 'MSNBC',
    spectrum_score: -0.78,
    confidence: 0.92,
    method: 'outlet',
    reasoning: 'Loaded language ("reckless", "rammed", "gut", "devastating") and exclusive sourcing from progressive advocates push this firmly left.',
  },
  {
    id: 'fb-2',
    url: 'https://example.com/fb-2',
    title: 'Senate Democrats torpedo bipartisan border deal, siding with open-borders activists',
    snippet: 'In a stunning betrayal of border state communities, Senate Democrats killed a bipartisan compromise this week, capitulating to far-left pressure groups.',
    source: 'Fox News',
    spectrum_score: 0.74,
    confidence: 0.93,
    method: 'outlet',
    reasoning: 'Framing ("torpedo", "betrayal", "capitulating", "open-borders") and source selection mark this as right-leaning commentary.',
  },
  {
    id: 'fb-3',
    url: 'https://example.com/fb-3',
    title: 'House passes spending bill on party-line vote',
    snippet: 'The House passed a $1.2 trillion spending package Thursday in a 218-210 vote that fell almost entirely along party lines, sending the measure to the Senate.',
    source: 'Reuters',
    spectrum_score: 0.02,
    confidence: 0.95,
    method: 'outlet',
    reasoning: 'Neutral verbs, attributed numerical detail, and balanced framing — characteristic Reuters wire copy.',
  },
  {
    id: 'fb-4',
    url: 'https://example.com/fb-4',
    title: 'Climate scientists warn Earth is hurtling toward catastrophic tipping points',
    snippet: 'Leading climate researchers issued a dire warning Tuesday, saying years of inaction have pushed the planet dangerously close to irreversible collapse of key ecosystems.',
    source: 'The Guardian',
    spectrum_score: -0.55,
    confidence: 0.88,
    method: 'outlet',
    reasoning: 'Charged adjectives ("hurtling", "dire", "catastrophic", "irreversible") and one-sided sourcing situate this on the left.',
  },
  {
    id: 'fb-5',
    url: 'https://example.com/fb-5',
    title: 'Climate alarmism falters as new data undercuts doomsday models',
    snippet: 'A growing body of analysis suggests the most apocalyptic climate forecasts are wildly overstated, according to skeptics who say the science has been politicized.',
    source: 'New York Post',
    spectrum_score: 0.62,
    confidence: 0.9,
    method: 'outlet',
    reasoning: 'Phrases like "alarmism", "wildly overstated" and reliance on skeptic sourcing push this to the right.',
  },
  {
    id: 'fb-6',
    url: 'https://example.com/fb-6',
    title: 'EPA finalizes new emissions standards for power plants',
    snippet: 'The Environmental Protection Agency announced Wednesday it will require existing coal plants and new gas plants to cut greenhouse gas emissions, citing the Clean Air Act.',
    source: 'Associated Press',
    spectrum_score: -0.04,
    confidence: 0.96,
    method: 'outlet',
    reasoning: 'Wire-service neutrality: action verbs, agency citation, no editorial framing.',
  },
  {
    id: 'fb-7',
    url: 'https://example.com/fb-7',
    title: 'Trump rallies fired-up base as crowd erupts over patriotic agenda',
    snippet: 'Thousands of energized supporters cheered the former president Saturday as he laid out an America First agenda the establishment refuses to embrace.',
    source: 'Breitbart',
    spectrum_score: 0.86,
    confidence: 0.94,
    method: 'outlet',
    reasoning: 'Heavy reliance on rally-style adjectives ("fired-up", "energized", "patriotic") and adversarial framing of "the establishment" mark a right-wing voice.',
  },
  {
    id: 'fb-8',
    url: 'https://example.com/fb-8',
    title: 'Progressives say working class deserves bold investment, not austerity',
    snippet: 'A coalition of labor unions and progressive lawmakers called Friday for sweeping public investment, arguing that decades of corporate tax cuts have hollowed out the middle class.',
    source: 'The Nation',
    spectrum_score: -0.72,
    confidence: 0.85,
    method: 'outlet',
    reasoning: 'Frame leans left: "hollowed out", "corporate tax cuts", and exclusive sourcing from unions and progressives.',
  },
  {
    id: 'fb-9',
    url: 'https://example.com/fb-9',
    title: 'Federal Reserve holds interest rates steady, citing mixed signals',
    snippet: 'The Federal Reserve left its benchmark interest rate unchanged Wednesday, with Chair Jerome Powell saying officials want more evidence inflation is sustainably easing.',
    source: 'The Wall Street Journal',
    spectrum_score: 0.08,
    confidence: 0.93,
    method: 'outlet',
    reasoning: 'Standard financial reporting: official quote, factual lede, no value-laden modifiers.',
  },
  {
    id: 'fb-10',
    url: 'https://example.com/fb-10',
    title: 'Activists slam corporate giveaway disguised as tax reform',
    snippet: 'Progressive watchdogs blasted the new tax package Thursday as a thinly veiled handout to wealthy donors, while ordinary families see only crumbs.',
    source: 'CNN',
    spectrum_score: -0.48,
    confidence: 0.86,
    method: 'outlet',
    reasoning: 'Words like "slam", "giveaway", "crumbs", and reliance on activist sourcing tilt this left.',
  },
  {
    id: 'fb-11',
    url: 'https://example.com/fb-11',
    title: 'Pro-growth tax cuts unleash American innovation, supporters say',
    snippet: 'Backers of the new tax framework hailed the measure Wednesday as a long-overdue restoration of free-market principles that will turbocharge investment and small business.',
    source: 'The Wall Street Journal',
    spectrum_score: 0.42,
    confidence: 0.81,
    method: 'outlet',
    reasoning: 'Pro-business framing ("unleash", "turbocharge"), but WSJ news desk keeps it from going further right.',
  },
  {
    id: 'fb-12',
    url: 'https://example.com/fb-12',
    title: 'Treasury releases analysis of new tax legislation impact',
    snippet: 'The Treasury Department published a 60-page assessment Tuesday projecting the legislation would reduce federal revenue by $1.4 trillion over a decade.',
    source: 'Bloomberg',
    spectrum_score: 0.0,
    confidence: 0.94,
    method: 'outlet',
    reasoning: 'Document-driven, numeric, no charged language.',
  },
  {
    id: 'fb-13',
    url: 'https://example.com/fb-13',
    title: 'Border crisis spirals as Biden refuses to enforce the law',
    snippet: 'Record migrant encounters surged again last month as the administration continues to ignore the chaos engulfing border communities, sources said.',
    source: 'Fox News',
    spectrum_score: 0.7,
    confidence: 0.91,
    method: 'outlet',
    reasoning: 'Charged framing ("crisis", "spirals", "refuses", "chaos") and one-sided source selection.',
  },
  {
    id: 'fb-14',
    url: 'https://example.com/fb-14',
    title: 'Migrants face hostile reception as states pass crackdown laws',
    snippet: 'Vulnerable asylum-seekers are increasingly running into harsh new state-level enforcement measures that civil liberties groups say criminalize basic survival.',
    source: 'NPR',
    spectrum_score: -0.42,
    confidence: 0.87,
    method: 'outlet',
    reasoning: 'Sympathetic framing ("vulnerable", "criminalize", "basic survival"); ACLU-style sourcing.',
  },
  {
    id: 'fb-15',
    url: 'https://example.com/fb-15',
    title: 'CBP reports 240,000 migrant encounters at southern border in March',
    snippet: 'U.S. Customs and Border Protection logged about 240,000 encounters with migrants at the southwest border in March, the agency said in its monthly report.',
    source: 'BBC',
    spectrum_score: -0.02,
    confidence: 0.95,
    method: 'outlet',
    reasoning: 'Agency report, exact figure, no editorializing — straight wire posture.',
  },
  {
    id: 'fb-16',
    url: 'https://example.com/fb-16',
    title: 'Republicans push reckless gun deregulation as mass shootings continue',
    snippet: 'Even as another community grieves, GOP lawmakers are pressing forward with sweeping rollbacks of common-sense firearm safeguards, gun-safety advocates warned.',
    source: 'CNN',
    spectrum_score: -0.6,
    confidence: 0.88,
    method: 'outlet',
    reasoning: 'Loaded language ("reckless", "common-sense"), grief framing, advocacy sourcing.',
  },
  {
    id: 'fb-17',
    url: 'https://example.com/fb-17',
    title: 'Second Amendment victory: court strikes down sweeping gun ban',
    snippet: 'A federal appeals court delivered a major win for gun owners Friday, striking down a state ban that pro-Second Amendment groups called unconstitutional overreach.',
    source: 'New York Post',
    spectrum_score: 0.66,
    confidence: 0.9,
    method: 'outlet',
    reasoning: 'Celebratory framing ("victory", "major win"), advocacy framing of opponents as overreaching.',
  },
  {
    id: 'fb-18',
    url: 'https://example.com/fb-18',
    title: 'Supreme Court hears arguments in Second Amendment case',
    snippet: 'The Supreme Court heard oral arguments Tuesday in a case that could reshape the contours of the Second Amendment, with justices probing both sides for nearly two hours.',
    source: 'Politico',
    spectrum_score: 0.05,
    confidence: 0.92,
    method: 'outlet',
    reasoning: 'Procedural reporting, no value-laden framing.',
  },
  {
    id: 'fb-19',
    url: 'https://example.com/fb-19',
    title: 'Medicare drug-price negotiation delivers historic relief for seniors',
    snippet: 'Seniors will finally see meaningful relief from out-of-control prescription costs thanks to landmark Medicare negotiation power, advocates celebrated.',
    source: 'The New York Times',
    spectrum_score: -0.32,
    confidence: 0.84,
    method: 'outlet',
    reasoning: 'Approving framing ("historic relief", "landmark", "out-of-control") and advocate-led sourcing nudge this left.',
  },
  {
    id: 'fb-20',
    url: 'https://example.com/fb-20',
    title: 'Drug-price negotiation will throttle innovation, industry warns',
    snippet: 'Pharmaceutical executives sounded the alarm Tuesday, warning that government price controls would devastate the U.S. biotech pipeline and cost lives down the road.',
    source: 'The Wall Street Journal',
    spectrum_score: 0.36,
    confidence: 0.83,
    method: 'outlet',
    reasoning: 'Industry-sourced framing ("throttle", "devastate", "cost lives") leans right but stops short of opinion territory.',
  },
]

const TOPIC_KEYWORDS: Record<string, string[]> = {
  immigration: ['immigration', 'border', 'migrant', 'asylum'],
  'climate change': ['climate', 'emissions', 'epa', 'environmental'],
  economy: ['tax', 'fed', 'economic', 'spending', 'fiscal', 'reserve', 'treasury'],
  'us politics': ['gop', 'democrat', 'republican', 'senate', 'house', 'biden', 'trump'],
  'foreign policy': ['border', 'foreign', 'state'],
  'gun policy': ['gun', 'firearm', 'second amendment', 'shooting'],
  'gun control': ['gun', 'firearm', 'second amendment', 'shooting'],
  taxes: ['tax', 'spending', 'treasury'],
  healthcare: ['medicare', 'medicaid', 'health', 'drug-price', 'prescription'],
  inflation: ['inflation', 'fed', 'reserve', 'rate'],
  'student loans': ['student', 'debt', 'loan'],
  'tax policy': ['tax', 'spending', 'treasury'],
  'healthcare reform': ['medicare', 'medicaid', 'health'],
  'minimum wage': ['wage', 'worker', 'union'],
  'social security': ['social security', 'senior', 'medicare'],
  'trade policy': ['trade', 'tariff'],
  'education funding': ['education', 'school', 'student'],
  crime: ['crime', 'law', 'border', 'gun'],
  education: ['education', 'school'],
}

function matchTopic(query: string): Article[] {
  const q = query.toLowerCase().trim()
  const keys = TOPIC_KEYWORDS[q] || q.split(/\s+/)
  const scored = FALLBACK_ARTICLES.map((a) => {
    const hay = `${a.title} ${a.snippet}`.toLowerCase()
    const hits = keys.filter((k) => hay.includes(k)).length
    return { a, hits }
  })
  const matched = scored.filter((s) => s.hits > 0).map((s) => s.a)
  if (matched.length >= 4) return matched
  // Combine matched with shuffled rest to always have ≥10
  const rest = FALLBACK_ARTICLES.filter((a) => !matched.includes(a))
  return [...matched, ...rest]
}

export function fallbackSearch(query: string): Article[] {
  const list = matchTopic(query)
  // Shuffle to vary games
  const shuffled = list.slice().sort(() => Math.random() - 0.5)
  return shuffled.map((a) => ({ ...a, id: `${a.id}-${Math.random().toString(36).slice(2, 7)}` }))
}

function toDetail(a: Article): ArticleDetail {
  return {
    id: a.id,
    article: a,
    bias_dimensions: {
      factuality: 0.7,
      economic: a.spectrum_score,
      social: a.spectrum_score * 0.9,
      establishment: 0.4,
      sensationalism: Math.min(1, Math.abs(a.spectrum_score) + 0.2),
      loaded_language: Math.min(1, Math.abs(a.spectrum_score) + 0.1),
      source_diversity: 0.5,
      headline_body_skew: 0.1,
    },
    highlighted_phrases: [],
  }
}

const COMPARE_PAIRS: Record<string, [string, string]> = {
  'climate change': ['fb-4', 'fb-5'],
  immigration: ['fb-14', 'fb-13'],
  'gun policy': ['fb-16', 'fb-17'],
  taxes: ['fb-10', 'fb-11'],
  healthcare: ['fb-19', 'fb-20'],
  'foreign policy': ['fb-13', 'fb-14'],
  inflation: ['fb-9', 'fb-12'],
  economy: ['fb-10', 'fb-11'],
  'student loans': ['fb-8', 'fb-2'],
  education: ['fb-8', 'fb-2'],
  crime: ['fb-16', 'fb-17'],
}

export function fallbackComparePair(query: string): ComparePair {
  const q = query.toLowerCase().trim()
  const ids = COMPARE_PAIRS[q]
  let a: Article
  let b: Article
  if (ids) {
    a = FALLBACK_ARTICLES.find((x) => x.id === ids[0])!
    b = FALLBACK_ARTICLES.find((x) => x.id === ids[1])!
  } else {
    // Pick a contrasting random pair
    const left = FALLBACK_ARTICLES.filter((x) => x.spectrum_score < -0.3)
    const right = FALLBACK_ARTICLES.filter((x) => x.spectrum_score > 0.3)
    a = left[Math.floor(Math.random() * left.length)]
    b = right[Math.floor(Math.random() * right.length)]
  }
  return {
    query,
    article_a: toDetail(a),
    article_b: toDetail(b),
  }
}

const LOADED_WORDS = [
  'reckless', 'devastating', 'slam', 'gut', 'spiral', 'crisis', 'crackdown',
  'unleash', 'torpedo', 'capitulate', 'betrayal', 'rammed', 'alarmism',
  'doomsday', 'fired-up', 'erupt', 'patriotic', 'reckless', 'overreach',
  'historic', 'landmark', 'throttle', 'hostile', 'soared', 'plummeted',
  'hurtling', 'catastrophic', 'irreversible', 'apocalyptic', 'wildly',
  'sweeping', 'common-sense', 'thinly veiled', 'giveaway', 'crumbs',
]

function jaccard(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const tb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  const inter = [...ta].filter((t) => tb.has(t)).length
  const union = new Set([...ta, ...tb]).size
  return union === 0 ? 0 : inter / union
}

export function fallbackHeadlineScore(original: string, rewrite: string): HeadlineRewriteScore {
  const orig = original.trim()
  const rew = rewrite.trim()
  if (!rew) {
    return { total: 0, breakdown: { tone: 0, distance: 0, signal: 0 } }
  }

  // Tone: penalize loaded words in rewrite
  const rewLower = rew.toLowerCase()
  const loadedHits = LOADED_WORDS.filter((w) => rewLower.includes(w)).length
  const tone = Math.max(0, 100 - loadedHits * 25)

  // Length similarity (closer to original length = better, within reason)
  const lenDelta = Math.abs(orig.length - rew.length)
  const lenScore = Math.max(0, 100 - lenDelta * 1.2)

  // Keyword overlap (signal preservation)
  const overlap = jaccard(orig, rew)
  const signalScore = Math.round(overlap * 100)

  // Distance from original (higher = more rewritten, sweet spot 30-70%)
  const distance = 1 - overlap
  const distanceScore = Math.round(100 * (1 - Math.abs(distance - 0.5) * 2))

  const total = Math.round(
    tone * 0.4 + lenScore * 0.15 + signalScore * 0.25 + distanceScore * 0.2,
  )

  return {
    total,
    breakdown: {
      tone,
      length_match: Math.round(lenScore),
      signal_kept: signalScore,
      distance: Math.max(0, distanceScore),
    },
    weights: { tone: 0.4, length_match: 0.15, signal_kept: 0.25, distance: 0.2 },
  }
}
