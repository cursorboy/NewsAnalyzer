import { useMemo } from 'react'

// Renders the input text word-by-word with each word's background opacity
// proportional to its attention-rollout score.
export default function SaliencyText({
  tokens,
  scores,
}: {
  tokens: string[]
  scores: number[]
}) {
  const { items, max } = useMemo(() => {
    // merge wordpiece tokens into surface words for nicer rendering, sum their scores.
    const items: { word: string; score: number; idxs: number[] }[] = []
    let maxScore = 0
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      const s = scores[i] ?? 0
      if (t === '[CLS]' || t === '[SEP]' || t === '[PAD]') continue
      if (t.startsWith('##') && items.length > 0) {
        const last = items[items.length - 1]
        last.word += t.slice(2)
        last.score += s
        last.idxs.push(i)
      } else {
        items.push({ word: t, score: s, idxs: [i] })
      }
      if (s > maxScore) maxScore = s
    }
    return { items, max: maxScore || 1 }
  }, [tokens, scores])

  return (
    <p className="font-mono text-[15px] leading-[2.0]">
      {items.map((it, i) => {
        const norm = it.score / max // 0..1
        // accent ink with opacity proportional to saliency, plus a thin underline
        const bg = `rgba(185,28,28,${(norm * 0.55).toFixed(3)})`
        return (
          <span
            key={i}
            title={`rollout = ${it.score.toFixed(5)} · tokens=[${it.idxs.join(',')}]`}
            className="px-[3px] py-[2px] mr-[2px]"
            style={{ backgroundColor: bg }}
          >
            {it.word}
          </span>
        )
      })}
    </p>
  )
}
