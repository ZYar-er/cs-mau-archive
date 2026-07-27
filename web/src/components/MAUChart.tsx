import { useMemo, useState } from 'react'
import { ParentSize } from '@visx/responsive'
import { Group } from '@visx/group'
import { AreaClosed, LinePath } from '@visx/shape'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { ClipPath } from '@visx/clip-path'
import { scaleTime, scaleLinear } from 'd3-scale'
import { curveMonotoneX } from 'd3-shape'
import type { MAURecord } from '../types'
import {
  getPeak,
  getMinMAU,
  getAvgMAU,
  getVersionPeak,
} from '../lib/data'
import { fmtNum, fmtMAU, fmtMonthShort } from '../lib/format'
import { useBrush } from '../hooks/useBrush'
import ChartBrush from './ChartBrush'
import ChartTooltip from './ChartTooltip'

const EVENTS = [
  { date: new Date('2012-08-21'), label: 'CS:GO', color: '#f5c542' },
  { date: new Date('2018-12-06'), label: 'F2P', color: '#d97ed9' },
  { date: new Date('2023-03-22'), label: 'CS2 Ann.', color: '#a4d007' },
  { date: new Date('2023-09-27'), label: 'CS2', color: '#a4d007' },
] as const

function movingAvg(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    const slice = data.slice(i - window + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b, 0) / window)
  })
}

interface ChartPoint {
  date: Date
  mau: number
  ma6: number | null
  record: MAURecord
}

interface Props {
  records: MAURecord[]
}

export default function MAUChart({ records }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-4 py-5 shadow-steam ring-1 ring-steam-border/50 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-steam-muted">
            MAU History
          </p>
        </div>
        <div style={{ height: 480 }}>
          <ParentSize>
            {({ width, height }) =>
              width > 0 && height > 0 ? (
                <ChartInner records={records} width={width} height={height} />
              ) : null
            }
          </ParentSize>
        </div>
      </div>
    </div>
  )
}

function ChartInner({
  records,
  width,
  height,
}: {
  records: MAURecord[]
  width: number
  height: number
}) {
  const brushH = 36
  const margin = { top: 16, right: 16, bottom: 28, left: 56 }
  const innerW = Math.max(0, width - margin.left - margin.right)
  const innerH = Math.max(0, height - margin.top - margin.bottom - brushH - 8)

  const { start, end, setStart, setEnd, clamp } = useBrush({
    count: records.length,
    initialStart: Math.max(0, records.length - 36),
    initialEnd: records.length - 1,
  })

  const points: ChartPoint[] = useMemo(() => {
    const ma = movingAvg(records.map((r) => r.mau), 6)
    return records.map((r, i) => ({
      date: new Date(r.date),
      mau: r.mau,
      ma6: ma[i],
      record: r,
    }))
  }, [records])

  const visiblePoints = points.slice(start, end + 1)

  const maxMAU = Math.max(...records.map((r) => r.mau))
  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([
          new Date(records[start].date),
          new Date(records[end].date),
        ])
        .range([0, innerW]),
    [records, start, end, innerW],
  )
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxMAU * 1.1])
        .range([innerH, 0]),
    [maxMAU, innerH],
  )

  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - margin.left
    if (x < 0 || x > innerW) {
      setHoverIdx(null)
      return
    }
    const date = xScale.invert(x)
    // nearest visible point
    let nearest = 0
    let best = Infinity
    for (let i = start; i <= end; i++) {
      const d = Math.abs(points[i].date.getTime() - date.getTime())
      if (d < best) {
        best = d
        nearest = i
      }
    }
    setHoverIdx(nearest)
  }

  // Path accessors
  const lineGen = (d: ChartPoint) => xScale(d.date)
  const lineY = (d: ChartPoint) => yScale(d.mau)
  const maY = (d: ChartPoint) => (d.ma6 == null ? NaN : yScale(d.ma6))

  // bottom stats
  const maxMAUVal = getPeak()?.mau ?? 0
  const minMAUVal = getMinMAU() ?? 0
  const avgMAUVal = getAvgMAU() ?? 0
  const csgoPeak = getVersionPeak('csgo')
  const cs2Peak = getVersionPeak('cs2')
  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null

  return (
    <>
      <svg width={width} height={height - brushH - 8}>
        <ClipPath id="chart-clip">
          <rect x={0} y={0} width={innerW} height={innerH} />
        </ClipPath>
        <Group top={margin.top} left={margin.left}>
          {/* Grid: horizontal lines at 5 steps */}
          {Array.from({ length: 5 }).map((_, i) => {
            const v = (maxMAU * 1.1) * (i / 4)
            const y = yScale(v)
            return (
              <line
                key={i}
                x1={0}
                x2={innerW}
                y1={y}
                y2={y}
                stroke="#2a3f5a"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )
          })}

          {/* Event lines (raw SVG, always visible — no library brush-hiding) */}
          {EVENTS.map((ev) => {
            const x = xScale(ev.date)
            if (x < 0 || x > innerW) return null
            return (
              <g key={ev.label}>
                <line
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={innerH}
                  stroke={ev.color}
                  strokeDasharray="4 3"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={-2}
                  fill={ev.color}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {ev.label}
                </text>
              </g>
            )
          })}

          {/* MAU area */}
          <AreaClosed<ChartPoint>
            data={visiblePoints}
            x={lineGen}
            y={lineY}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#mauAreaGrad)"
            stroke="transparent"
            clipPath="url(#chart-clip)"
          />
          {/* MAU line */}
          <LinePath<ChartPoint>
            data={visiblePoints}
            x={lineGen}
            y={lineY}
            curve={curveMonotoneX}
            stroke="#66c0f4"
            strokeWidth={1.5}
            clipPath="url(#chart-clip)"
          />
          {/* 6-month moving average */}
          <LinePath<ChartPoint>
            data={visiblePoints.filter((p) => p.ma6 != null)}
            x={lineGen}
            y={maY}
            curve={curveMonotoneX}
            stroke="#f5c542"
            strokeWidth={1}
            strokeDasharray="3 2"
            clipPath="url(#chart-clip)"
          />

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            tickFormat={(d) => fmtMAU(+d)}
            stroke="#2a3f5a"
            tickStroke="#2a3f5a"
            tickLabelProps={() => ({
              fill: '#8f98a0',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
              dx: '-0.4em',
            })}
          />
          <AxisBottom
            scale={xScale}
            top={innerH}
            stroke="#2a3f5a"
            tickStroke="#2a3f5a"
            tickFormat={(d) => fmtMonthShort((d as Date).toISOString())}
            tickLabelProps={() => ({
              fill: '#8f98a0',
              fontSize: 10,
              textAnchor: 'middle',
              dy: '0.33em',
            })}
          />

          {/* Hover crosshair + dot */}
          {hoverPoint && (
            <g pointerEvents="none">
              <line
                x1={xScale(hoverPoint.date)}
                x2={xScale(hoverPoint.date)}
                y1={0}
                y2={innerH}
                stroke="#66c0f4"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <circle
                cx={xScale(hoverPoint.date)}
                cy={yScale(hoverPoint.mau)}
                r={4}
                fill="#66c0f4"
              />
            </g>
          )}

          {/* Hover capture rect */}
          <rect
            x={0}
            y={0}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHoverIdx(null)}
          />

          {/* Gradient def */}
          <defs>
            <linearGradient id="mauAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66c0f4" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#66c0f4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
        </Group>
      </svg>

      {/* Tooltip (HTML overlay) */}
      {hoverPoint && (
        <ChartTooltip
          record={hoverPoint.record}
          ma6={hoverPoint.ma6}
          x={xScale(hoverPoint.date) + margin.left}
          y={yScale(hoverPoint.mau) + margin.top}
          width={width}
        />
      )}

      {/* Brush */}
      <div style={{ marginTop: 4, paddingLeft: margin.left, paddingRight: margin.right }}>
        <ChartBrush
          records={records}
          start={start}
          end={end}
          onChange={(ns, ne) => {
            const [s, e] = clamp(ns, ne)
            setStart(s)
            setEnd(e)
          }}
          height={brushH}
        />
      </div>

      {/* Bottom stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-steam-border/50 pt-4 sm:grid-cols-5">
        <Stat label="Peak" value={fmtNum(maxMAUVal)} />
        <Stat label="Lowest" value={fmtNum(minMAUVal)} />
        <Stat label="Average" value={fmtNum(avgMAUVal)} />
        <Stat label="CS:GO Peak" value={fmtNum(csgoPeak)} />
        <Stat label="CS2 Peak" value={fmtNum(cs2Peak)} />
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wider text-steam-muted">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-steam-text">{value}</p>
    </div>
  )
}
