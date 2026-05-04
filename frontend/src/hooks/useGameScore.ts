import { useCallback, useEffect, useState } from 'react'

export type RecordResult = {
  userPoints: number
  modelPoints: number
}

export type UseGameScoreOptions = {
  totalRounds?: number
  storageKey: string
}

export type UseGameScoreReturn = {
  currentRound: number
  userScore: number
  modelScore: number
  streak: number
  bestEver: number
  totalRounds: number
  recordResult: (userPoints: number, modelPoints: number, accurate?: boolean) => void
  nextRound: () => void
  reset: () => void
  isFinished: boolean
}

function readBest(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeBest(storageKey: string, value: number): void {
  try {
    localStorage.setItem(storageKey, String(value))
  } catch {
    /* ignore */
  }
}

export function useGameScore({
  totalRounds = 10,
  storageKey,
}: UseGameScoreOptions): UseGameScoreReturn {
  const [currentRound, setCurrentRound] = useState(1)
  const [userScore, setUserScore] = useState(0)
  const [modelScore, setModelScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestEver, setBestEver] = useState(() => readBest(storageKey))
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    setBestEver(readBest(storageKey))
  }, [storageKey])

  const recordResult = useCallback(
    (userPoints: number, modelPoints: number, accurate = userPoints > 0) => {
      setUserScore((s) => {
        const next = s + userPoints
        if (next > bestEver) {
          setBestEver(next)
          writeBest(storageKey, next)
        }
        return next
      })
      setModelScore((s) => s + modelPoints)
      setStreak((s) => (accurate ? s + 1 : 0))
    },
    [bestEver, storageKey],
  )

  const nextRound = useCallback(() => {
    setCurrentRound((r) => {
      if (r >= totalRounds) {
        setIsFinished(true)
        return r
      }
      return r + 1
    })
  }, [totalRounds])

  const reset = useCallback(() => {
    setCurrentRound(1)
    setUserScore(0)
    setModelScore(0)
    setStreak(0)
    setIsFinished(false)
  }, [])

  return {
    currentRound,
    userScore,
    modelScore,
    streak,
    bestEver,
    totalRounds,
    recordResult,
    nextRound,
    reset,
    isFinished,
  }
}
