import { useRef, useState, useCallback } from 'react'
import type { MAURecord } from '../types'
import { fmtMonthShort } from '../lib/format'

interface Props {
  records: MAURecord[]
  start: number
  end: number
  onChange: (start: number, end: number) => void
  height?: number
}

type DragMode = 'move' | 'left' | 'right' | null

export default function ChartBrush({
  records,
  start,
  end,
  onChange,
  height = 36,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<{
    mode: DragMode
    startX: number
    origStart: number
    origEnd: number
  } | null>(null)

  const count = records.length

  const idxToX = useCallback(
    (idx: number, width: number) => (count <= 1 ? 0 : (idx / (count - 1)) * width),
    [count],
  )
  const xToIdx = useCallback(
    (x: number, width: number) =>
      count <= 1 ? 0 : Math.round((x / width) * (count - 1)),
    [count],
  )

  const onPointerDown = (mode: DragMode) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDrag({
      mode,
      startX: e.clientX - rect.left,
      origStart: start,
      origEnd: end,
    })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const dxIdx = xToIdx(x, width) - xToIdx(drag.startX, width)

    if (drag.mode === 'move') {
      const span = drag.origEnd - drag.origStart
      let ns = drag.origStart + dxIdx
      let ne = drag.origEnd + dxIdx
      if (ns < 0) {
        ns = 0
        ne = span
      }
      if (ne > count - 1) {
        ne = count - 1
        ns = ne - span
      }
      onChange(Math.round(ns), Math.round(ne))
    } else if (drag.mode === 'left') {
      const ns = Math.min(drag.origStart + dxIdx, drag.origEnd - 2)
      onChange(Math.max(0, Math.round(ns)), end)
    } else if (drag.mode === 'right') {
      const ne = Math.max(drag.origEnd + dxIdx, drag.origStart + 2)
      onChange(start, Math.min(count - 1, Math.round(ne)))
    }
  }

  const onPointerUp = () => setDrag(null)

  // SVG viewBox: 0..1000 horizontal
  const VB_W = 1000
  const selX1 = idxToX(start, VB_W)
  const selX2 = idxToX(end, VB_W)
  const handleW = 6

  // Minimap line path across all records (normalized to brush height)
  const maxMAU = Math.max(...records.map((r) => r.mau))
  const linePath = records
    .map((r, i) => {
      const x = idxToX(i, VB_W)
      const y = height - (r.mau / maxMAU) * (height - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="mt-2 select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Background */}
      <rect x={0} y={0} width={VB_W} height={height} fill="#16202d" />
      {/* Minimap line */}
      <path
        d={linePath}
        fill="none"
        stroke="#316282"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {/* Outside-selection dim overlay */}
      <rect x={0} y={0} width={selX1} height={height} fill="#0b1018" fillOpacity={0.5} />
      <rect
        x={selX2}
        y={0}
        width={VB_W - selX2}
        height={height}
        fill="#0b1018"
        fillOpacity={0.5}
      />
      {/* Selection border */}
      <rect
        x={selX1}
        y={0}
        width={selX2 - selX1}
        height={height}
        fill="#66c0f4"
        fillOpacity={0.08}
        stroke="#66c0f4"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        onPointerDown={onPointerDown('move')}
        style={{ cursor: 'move' }}
      />
      {/* Left handle */}
      <rect
        x={selX1 - handleW / 2}
        y={0}
        width={handleW}
        height={height}
        fill="#66c0f4"
        onPointerDown={onPointerDown('left')}
        style={{ cursor: 'ew-resize' }}
      />
      {/* Right handle */}
      <rect
        x={selX2 - handleW / 2}
        y={0}
        width={handleW}
        height={height}
        fill="#66c0f4"
        onPointerDown={onPointerDown('right')}
        style={{ cursor: 'ew-resize' }}
      />
      {/* Edge labels */}
      <text
        x={selX1}
        y={height - 2}
        fill="#8f98a0"
        fontSize={9}
        textAnchor="start"
      >
        {fmtMonthShort(records[start]?.date ?? '')}
      </text>
      <text
        x={selX2}
        y={height - 2}
        fill="#8f98a0"
        fontSize={9}
        textAnchor="end"
      >
        {fmtMonthShort(records[end]?.date ?? '')}
      </text>
    </svg>
  )
}
