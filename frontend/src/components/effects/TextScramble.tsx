// Hover-to-decode scramble text. Adapted from 21st.dev's "Text Scramble".
// Each character ticks through a random set until the reveal cursor reaches
// it, then snaps to its true value. The active (still-scrambling) characters
// are tinted with the accent color so the eye can track the reveal sweep.
//
// Adaptations:
//  • Dropped Next.js / cn dependency
//  • Kept the editorial typography hooks open (className + monoClassName)
//  • Re-scrambles every time the cursor re-enters the element

import { useCallback, useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'

interface TextScrambleProps {
  text: string
  className?: string
  duration?: number
  activeClassName?: string
}

export function TextScramble({
  text,
  className,
  duration,
  activeClassName = 'text-accent',
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text)
  const [scrambling, setScrambling] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const frameRef = useRef(0)

  const scramble = useCallback(() => {
    setScrambling(true)
    frameRef.current = 0
    const totalFrames = (duration ?? text.length * 3)

    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(() => {
      frameRef.current += 1
      const progress = frameRef.current / totalFrames
      const revealed = Math.floor(progress * text.length)
      const next = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (i < revealed) return text[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')
      setDisplayText(next)
      if (frameRef.current >= totalFrames) {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
        setDisplayText(text)
        setScrambling(false)
      }
    }, 30)
  }, [text, duration])

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <span
      className={`inline-flex cursor-pointer select-none ${className ?? ''}`}
      onMouseEnter={scramble}
    >
      {displayText.split('').map((char, i) => (
        <span
          key={i}
          className={
            scrambling && char !== text[i] ? activeClassName : undefined
          }
        >
          {char}
        </span>
      ))}
    </span>
  )
}
