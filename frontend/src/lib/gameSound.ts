let ctx: AudioContext | null = null
const KEY = 'sfx_muted'
let muted: boolean = readMuted()

function readMuted(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    if (v === null) return false
    return v === '1'
  } catch {
    return false
  }
}

function writeMuted(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const Cls = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Cls()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.08, delayMs = 0) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  const t0 = c.currentTime + delayMs / 1000
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + durMs / 1000 + 0.02)
}

const subscribers = new Set<(muted: boolean) => void>()

export const sfx = {
  setMuted(v: boolean) {
    muted = v
    writeMuted(v)
    subscribers.forEach((s) => s(v))
  },
  toggleMuted(): boolean {
    sfx.setMuted(!muted)
    return muted
  },
  isMuted(): boolean {
    return muted
  },
  subscribe(fn: (muted: boolean) => void): () => void {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  },
  unlock() {
    const c = getCtx()
    if (c && c.state === 'suspended') c.resume().catch(() => {})
  },
  click() {
    tone(520, 50, 'square', 0.04)
  },
  correct() {
    tone(523.25, 90, 'sine', 0.07, 0)
    tone(659.25, 90, 'sine', 0.07, 30)
    tone(783.99, 130, 'sine', 0.07, 60)
  },
  wrong() {
    tone(330, 90, 'sawtooth', 0.05, 0)
    tone(311.13, 130, 'sawtooth', 0.05, 70)
  },
  streak() {
    tone(523.25, 80, 'triangle', 0.06, 0)
    tone(659.25, 80, 'triangle', 0.06, 70)
    tone(783.99, 80, 'triangle', 0.06, 140)
    tone(1046.5, 160, 'triangle', 0.07, 210)
  },
  fanfare() {
    tone(523.25, 130, 'triangle', 0.07, 0)
    tone(659.25, 130, 'triangle', 0.07, 110)
    tone(783.99, 260, 'triangle', 0.08, 220)
    tone(1046.5, 320, 'sine', 0.07, 350)
  },
  tick() {
    tone(660, 60, 'square', 0.05)
  },
  go() {
    tone(880, 80, 'triangle', 0.07, 0)
    tone(1318.5, 220, 'sine', 0.08, 50)
  },
  reveal() {
    tone(620, 100, 'triangle', 0.05)
  },
}

// Lightweight React-friendly hook
import { useEffect, useState } from 'react'

export function useSfxMuted(): [boolean, () => void] {
  const [v, setV] = useState<boolean>(sfx.isMuted())
  useEffect(() => sfx.subscribe(setV), [])
  return [v, () => sfx.toggleMuted()]
}
