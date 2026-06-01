// Conic-gradient pulse CTA. Adapted from 21st.dev's "Shiny Button" (the CSS
// @property-driven one). Theme: ink-black background, paper-cream text, accent
// (deep red) highlight — matches the editorial palette instead of the upstream
// black/blue. Uses inline <style> rather than styled-jsx so it runs in plain
// React without Next.js.

import type { CSSProperties, ReactNode } from 'react'

interface ShinyButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  href?: string
}

const STYLES = `
@property --gradient-angle-21 {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@property --gradient-angle-offset-21 {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@property --gradient-percent-21 {
  syntax: "<percentage>";
  initial-value: 14%;
  inherits: false;
}
@property --gradient-shine-21 {
  syntax: "<color>";
  initial-value: #fdf7e8;
  inherits: false;
}

.shiny-cta-21 {
  --bg: #111111;
  --bg-subtle: #1c1c1c;
  --fg: #fdf7e8;
  --highlight: #ef4444;
  --highlight-subtle: #fca5a5;
  --animation: gradient-angle-21 linear infinite;
  --duration: 1.8s;
  --shadow-size: 3px;
  --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
  isolation: isolate;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  outline-offset: 4px;
  padding: 0.95rem 2.1rem;
  font-family: inherit;
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 1;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 0;
  color: var(--fg);
  background:
    linear-gradient(var(--bg), var(--bg)) padding-box,
    conic-gradient(
      from calc(var(--gradient-angle-21) - var(--gradient-angle-offset-21)),
      transparent,
      var(--highlight) var(--gradient-percent-21),
      var(--gradient-shine-21) calc(var(--gradient-percent-21) * 2),
      var(--highlight) calc(var(--gradient-percent-21) * 3),
      transparent calc(var(--gradient-percent-21) * 4)
    ) border-box;
  box-shadow: inset 0 0 0 1px var(--bg-subtle);
  transition: var(--transition);
  transition-property: --gradient-angle-offset-21, --gradient-percent-21, --gradient-shine-21;
}
.shiny-cta-21::before,
.shiny-cta-21::after {
  content: "";
  pointer-events: none;
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  translate: -50% -50%;
  z-index: -1;
}
.shiny-cta-21:active { translate: 0 1px; }
.shiny-cta-21::before {
  --size: calc(100% - var(--shadow-size) * 3);
  --position: 2px;
  --space: calc(var(--position) * 2);
  width: var(--size);
  height: var(--size);
  background: radial-gradient(
    circle at var(--position) var(--position),
    #fdf7e8 calc(var(--position) / 4),
    transparent 0
  ) padding-box;
  background-size: var(--space) var(--space);
  background-repeat: space;
  mask-image: conic-gradient(
    from calc(var(--gradient-angle-21) + 45deg),
    black,
    transparent 10% 90%,
    black
  );
  border-radius: inherit;
  opacity: 0.35;
  z-index: -1;
}
.shiny-cta-21::after {
  --animation: shimmer-21 linear infinite;
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(-50deg, transparent, var(--highlight), transparent);
  mask-image: radial-gradient(circle at bottom, transparent 30%, black);
  opacity: 0.9;
}
.shiny-cta-21:is(:hover, :focus-visible) {
  --gradient-percent-21: 28%;
  box-shadow:
    inset 0 0 0 1px var(--bg-subtle),
    0 0 0 1px var(--highlight),
    0 8px 24px -6px rgba(185, 28, 28, 0.55);
}
.shiny-cta-21 span { position: relative; z-index: 1; }
.shiny-cta-21,
.shiny-cta-21::before,
.shiny-cta-21::after {
  animation: var(--animation) var(--duration),
             var(--animation) calc(var(--duration) / 0.4) reverse paused;
  animation-composition: add;
}
.shiny-cta-21:is(:hover, :focus-visible) {
  --gradient-angle-offset-21: 95deg;
  --gradient-shine-21: var(--highlight-subtle);
}
.shiny-cta-21:is(:hover, :focus-visible),
.shiny-cta-21:is(:hover, :focus-visible)::before,
.shiny-cta-21:is(:hover, :focus-visible)::after {
  animation-play-state: running;
}
@keyframes gradient-angle-21 {
  to { --gradient-angle-21: 360deg; }
}
@keyframes shimmer-21 {
  to { rotate: 360deg; }
}
`

export function ShinyButton({ children, onClick, className, type = 'button', href }: ShinyButtonProps) {
  const cls = `shiny-cta-21 ${className ?? ''}`
  // Inline styles work fine to inject once per render. Stripping duplicate
  // <style> tags is browser-handled (later occurrences are ignored when the
  // selector signatures match).
  const styleNode = <style dangerouslySetInnerHTML={{ __html: STYLES }} />
  if (href) {
    return (
      <>
        {styleNode}
        <a href={href} className={cls} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } as CSSProperties}>
          <span>{children}</span>
        </a>
      </>
    )
  }
  return (
    <>
      {styleNode}
      <button type={type} onClick={onClick} className={cls}>
        <span>{children}</span>
      </button>
    </>
  )
}
