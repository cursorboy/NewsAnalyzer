import type { ReactNode } from 'react'

export default function DropCap({
  letter,
  children,
  size = 'lg',
}: {
  letter: string
  children: ReactNode
  size?: 'md' | 'lg'
}) {
  const cls =
    size === 'lg'
      ? 'float-left mr-3 mt-1 font-display text-[78px] font-black leading-[0.78] text-ink'
      : 'float-left mr-2 mt-1 font-display text-[56px] font-black leading-[0.78] text-ink'
  return (
    <p className="font-serif text-[17px] leading-[1.7] text-ink/85 md:text-lg">
      <span className={cls} aria-hidden>
        {letter}
      </span>
      {children}
    </p>
  )
}
