import { useLayoutEffect, useRef, useState } from 'react'
import { fmtNum } from '../lib/format'

interface Props {
  value: number
  /** Starting value for the count-up animation; defaults to 0. */
  from?: number
  durationMs?: number
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Animated count-up number.
 *
 * SSR/hydration-safe: the initial state is the final `value`, which matches
 * the prerendered HTML, so crawlers and no-JS users always see the real
 * number. Right after hydration (useLayoutEffect, before paint) the display
 * jumps to `from` and animates to `value`. Respects prefers-reduced-motion.
 */
export default function AnimatedNumber({
  value,
  from,
  durationMs = 900,
}: Props) {
  const [display, setDisplay] = useState(value)
  const rafRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const start = from ?? 0
    setDisplay(start)
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      setDisplay(Math.round(start + (value - start) * easeOutCubic(t)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, from, durationMs])

  return <>{fmtNum(display)}</>
}
