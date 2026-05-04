const RIGHT = [
  'Nailed it.',
  'Sharp.',
  'The network agrees.',
  'Yes, that\'s the one.',
  'Dead on.',
  'Filed perfectly.',
]

const WRONG = [
  'Way off.',
  'Not even close.',
  'Nope, try again next round.',
  'The network laughs.',
  'Missed the mark.',
  'That one slipped.',
]

const PARTIAL = [
  'Half right.',
  'Got one out of two.',
  'Closer than not.',
  'Split decision.',
]

function pick(arr: readonly string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const copy = {
  right: () => pick(RIGHT),
  wrong: () => pick(WRONG),
  partial: () => pick(PARTIAL),
  matchedNetwork: () => 'You matched the network.',
  outClassified: () => 'You out-classified the network on that one.',
  finalWin: () => 'You beat the network.',
  finalLoss: () => 'The network won this round.',
  finalTie: () => 'Dead even.',
  streakTier: (n: number): string | null => {
    if (n >= 10) return 'FLAWLESS.'
    if (n >= 5) return `ON FIRE, ${n}`
    if (n >= 3) return `${n} IN A ROW`
    return null
  },
}
