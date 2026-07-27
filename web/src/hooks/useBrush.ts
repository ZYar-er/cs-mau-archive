import { useCallback, useState } from 'react'

interface Options {
  count: number
  initialStart?: number
  initialEnd?: number
  minSpan?: number
}

export function useBrush({
  count,
  initialStart = 0,
  initialEnd,
  minSpan = 2,
}: Options) {
  const [start, setStart] = useState(
    Math.max(0, Math.min(initialStart, count - 1)),
  )
  const [end, setEnd] = useState(
    Math.min(initialEnd ?? count - 1, count - 1),
  )

  const clamp = useCallback(
    (nextStart: number, nextEnd: number): [number, number] => {
      let s = Math.max(0, Math.min(nextStart, count - 1))
      let e = Math.max(0, Math.min(nextEnd, count - 1))
      if (e - s < minSpan) {
        // Preserve the moved boundary; stretch the other side
        if (nextStart !== start) {
          s = Math.max(0, e - minSpan)
        } else {
          e = Math.min(count - 1, s + minSpan)
        }
      }
      return [s, e]
    },
    [count, minSpan, start],
  )

  return { start, end, setStart, setEnd, clamp }
}
