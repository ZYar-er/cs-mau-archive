import { useRef, useEffect, useMemo } from 'react'
import { init, getInstanceByDom } from 'echarts/core'
import type { EChartsType } from 'echarts'
import '../lib/echarts'
import type { MAURecord } from '../types'
import {
  getPeak,
  getMinMAU,
  getAvgMAU,
  getVersionPeak,
} from '../lib/data'
import { fmtNum, fmtMAU } from '../lib/format'

const EVENTS = [
  { date: '2012-08-21', label: 'CS:GO', color: '#f5c542' },
  { date: '2018-12-06', label: 'F2P', color: '#d97ed9' },
  { date: '2023-03-22', label: 'CS2 Ann.', color: '#a4d007' },
  { date: '2023-09-27', label: 'CS2', color: '#a4d007' },
] as const

function movingAvg(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    const slice = data.slice(i - window + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b, 0) / window)
  })
}

function areaGradient() {
  return {
    type: 'linear' as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: 'rgba(102, 192, 244, 0.25)' },
      { offset: 1, color: 'rgba(102, 192, 244, 0.02)' },
    ],
  }
}

interface Props {
  records: MAURecord[]
}

export default function MAUChart({ records }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)
  const maxRef = useRef<number>(0)

  const mauData: [Date, number][] = useMemo(
    () => records.map((r) => [new Date(r.date), r.mau]),
    [records],
  )

  const ma6Data = useMemo(() => {
    const ma = movingAvg(
      records.map((r) => r.mau),
      6,
    )
    return records
      .map((r, i) => (ma[i] != null ? [new Date(r.date), ma[i]!] : null))
      .filter((v): v is [Date, number] => v != null)
  }, [records])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const existing = getInstanceByDom(el)
    if (existing) existing.dispose()

    const chart = init(el)
    chartRef.current = chart

    const initialMax = Math.max(...records.map((r) => r.mau)) * 1.1

    const option: Record<string, unknown> = {
      grid: { left: 56, right: 16, top: 18, bottom: 56 },
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: {
          type: 'cross' as const,
          snap: true,
          crossStyle: { color: '#66c0f4' },
        },
        backgroundColor: '#16202d',
        borderColor: '#2a3f5a',
        textStyle: { color: '#c6d4df', fontSize: 12 },
        formatter: (params: Array<{
          axisValue: string
          seriesName: string
          value: [Date, number]
        }>) => {
          const p = params[0]
          if (!p) return ''
          const d = new Date(p.axisValue)
          const fmt = (n: number) => n.toLocaleString('en-US')
          const record = records.find(
            (r) => new Date(r.date).getTime() === d.getTime(),
          )
          return `<div style="font-size:12px">
            <div style="color:#66c0f4;margin-bottom:4px">${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#66c0f4;margin-right:6px"></span>MAU: <span style="font-family:monospace;color:#c6d4df">${fmt(p.value[1])}</span></div>
            ${params.length > 1 && params[1] ? `<div style="margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f5c542;margin-right:6px"></span>6-Month Avg: <span style="font-family:monospace;color:#c6d4df">${fmt(params[1].value[1])}</span></div>` : ''}
            ${record ? `<div style="margin-top:4px;color:#8f98a0">${record.game_version.toUpperCase()}</div>` : ''}
          </div>`
        },
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#2a3f5a' } },
        axisLabel: { color: '#8f98a0', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: initialMax,
        axisLabel: {
          color: '#8f98a0',
          fontSize: 11,
          formatter: (v: number) => fmtMAU(v),
        },
        splitLine: { lineStyle: { color: '#2a3f5a', type: 'dashed' as const } },
      },
      dataZoom: [
        {
          type: 'slider',
          start: Math.max(0, ((records.length - 36) / records.length) * 100),
          end: 100,
          height: 28,
          bottom: 8,
          borderColor: '#316282',
          fillerColor: 'rgba(102, 192, 244, 0.08)',
          handleStyle: { color: '#66c0f4' },
          textStyle: { color: '#8f98a0', fontSize: 11 },
          moveHandleStyle: { color: '#66c0f4' },
        },
        { type: 'inside' as const },
      ],
      series: [
        {
          type: 'line',
          name: 'MAU',
          data: mauData,
          smooth: true,
          symbol: 'none' as const,
          lineStyle: { color: '#66c0f4', width: 1.5 },
          areaStyle: { color: areaGradient() },
          markLine: {
            symbol: 'none' as const,
            silent: true,
            data: EVENTS.map((ev) => ({
              xAxis: ev.date,
              label: {
                show: true,
                formatter: ev.label,
                position: 'insideEndTop' as const,
                color: ev.color,
                fontSize: 10,
              },
              lineStyle: {
                color: ev.color,
                type: 'dashed' as const,
                width: 1,
              },
            })),
          },
        },
        {
          type: 'line',
          name: '6-Month Avg',
          data: ma6Data,
          smooth: true,
          symbol: 'none' as const,
          lineStyle: { color: '#f5c542', width: 1, type: 'dashed' as const },
          areaStyle: undefined,
        },
      ],
    }

    chart.setOption(option)

    // Y-axis auto-adapt to visible range
    chart.on('dataZoom', () => {
      const opt = chart.getOption() as {
        dataZoom?: Array<{ startValue?: number; endValue?: number }>
      }
      const dz = opt.dataZoom?.[0]
      if (!dz || dz.startValue == null || dz.endValue == null) return
      const s = Number(dz.startValue)
      const e = Number(dz.endValue)
      const visible = records.filter((r) => {
        const t = new Date(r.date).getTime()
        return t >= s && t <= e
      })
      if (visible.length === 0) return
      const visibleMax = Math.max(...visible.map((r) => r.mau))
      const nextMax = visibleMax * 1.1
      if (Math.abs(nextMax - maxRef.current) > 100) {
        maxRef.current = nextMax
        chart.setOption(
          { yAxis: { min: 0, max: nextMax } },
          { silent: true },
        )
      }
    })

    // Responsive resize
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [records, mauData, ma6Data])

  // Bottom stats (computed over ALL records, unaffected by brush)
  const maxMAU = getPeak()?.mau ?? 0
  const minMAU = getMinMAU() ?? 0
  const avgMAU = getAvgMAU() ?? 0
  const csgoPeak = getVersionPeak('csgo')
  const cs2Peak = getVersionPeak('cs2')

  const startDate = records[0]?.date
  const endDate = records[records.length - 1]?.date
  const startYear = startDate ? new Date(startDate).getFullYear() : ''
  const endYear = endDate ? new Date(endDate).getFullYear() : ''

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-4 py-5 shadow-steam ring-1 ring-steam-border/50 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-steam-muted">
            MAU History
          </p>
          <span className="text-xs text-steam-muted">
            {startYear} → {endYear} · {records.length} mo
          </span>
        </div>

        <div ref={containerRef} style={{ width: '100%', height: 420 }} />

        {/* Bottom stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-steam-border/50 pt-4 sm:grid-cols-5">
          <Stat label="Peak" value={fmtNum(maxMAU)} />
          <Stat label="Lowest" value={fmtNum(minMAU)} />
          <Stat label="Average" value={fmtNum(avgMAU)} />
          <Stat label="CS:GO Peak" value={fmtNum(csgoPeak)} />
          <Stat label="CS2 Peak" value={fmtNum(cs2Peak)} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-steam-text">
        {value}
      </p>
    </div>
  )
}
