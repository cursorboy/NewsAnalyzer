// Light-beam that travels around a card's border. Adapted from 21st.dev's
// BorderBeam. Uses CSS offset-path on a radial-gradient blob; mask compositing
// trims it to a 1px border so the bright light only shows along the perimeter.
//
// Adaptations:
//  • `motion/react` → `framer-motion`
//  • Dropped `cn` (plain className concat)
//  • Default `lightColor` switched to the project accent (#b91c1c)

import { useEffect, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'

interface BorderBeamProps {
  lightWidth?: number
  duration?: number
  lightColor?: string
  borderWidth?: number
  className?: string
}

export function BorderBeam({
  lightWidth = 220,
  duration = 8,
  lightColor = '#b91c1c',
  borderWidth = 1,
  className,
}: BorderBeamProps) {
  const pathRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const div = pathRef.current
    if (!div) return
    const update = () => {
      div.style.setProperty(
        '--path-21',
        `path("M 0 0 H ${div.offsetWidth} V ${div.offsetHeight} H 0 V 0")`,
      )
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div
      ref={pathRef}
      style={
        {
          '--duration-21': duration,
          '--border-width-21': `${borderWidth}px`,
        } as CSSProperties
      }
      className={`pointer-events-none absolute inset-0 z-0 rounded-[inherit] border-[length:var(--border-width-21)] [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(red,red)] before:absolute before:inset-0 before:z-[-1] before:rounded-[inherit] before:border-[length:var(--border-width-21)] before:border-ink/10 ${className ?? ''}`}
    >
      <motion.div
        className="absolute inset-0 aspect-square bg-[radial-gradient(ellipse_at_center,var(--light-color-21),transparent,transparent)]"
        style={
          {
            '--light-color-21': lightColor,
            '--light-width-21': `${lightWidth}px`,
            width: 'var(--light-width-21)',
            offsetPath: 'var(--path-21)',
          } as CSSProperties
        }
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}
