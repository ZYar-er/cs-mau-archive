import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { init, getInstanceByDom } from 'echarts/core'
import type { EChartsType } from 'echarts'
import '../lib/echarts'
import type { MAURecord } from '../types'
import {
  getPeak,
  getAvgMAU,
  getVersionAvgMAU,
  getVersionMinMAU,
  getVersionPeak,
  getVersionPeakRecord,
} from '../lib/data'
import { fmtNum, fmtMAU, fmtDate } from '../lib/format'
import { useI18n, type Translator } from '../lib/i18n'

const EVENTS = [
  { date: '2012-08-21', labelKey: 'eventCsgo', color: '#f5c542' },
  { date: '2018-12-06', labelKey: 'eventF2p', color: '#d97ed9' },
  { date: '2023-03-22', labelKey: 'eventCs2Ann', color: '#a4d007' },
  { date: '2023-09-27', labelKey: 'eventCs2', color: '#a4d007' },
] as const

const COMPACT_BREAKPOINT = 640

type RangeBtn = '1Y' | '2Y' | '3Y' | 'all' | 'cs2' | 'csgo' | null

const RANGE_BUTTONS: { key: RangeBtn; label: string }[] = [
  { key: '1Y', label: '1Y' },
  { key: '2Y', label: '2Y' },
  { key: '3Y', label: '3Y' },
  { key: 'all', label: 'All' },
  { key: 'csgo', label: 'CS:GO' },
  { key: 'cs2', label: 'CS2' },
]

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

function buildMarkLineData(compact: boolean, t: Translator) {
  const csgoPeak = getVersionPeakRecord('csgo')
  return [
    ...EVENTS.map((ev) => ({
      xAxis: ev.date,
      label: {
        show: compact ? ev.labelKey !== 'eventCs2Ann' : true,
        formatter: t(ev.labelKey),
        position: 'insideEndTop' as const,
        color: ev.color,
        fontSize: compact ? 9 : 10,
      },
      lineStyle: {
        color: ev.color,
        type: 'dashed' as const,
        width: 1,
      },
    })),
    {
      name: 'CS:GO Peak',
      xAxis: csgoPeak?.date ?? '',
      label: {
        show: true,
        formatter: compact
          ? t('csgoPeak')
          : csgoPeak
            ? `${t('csgoPeak')} · ${fmtMAU(csgoPeak.mau)}`
            : t('csgoPeak'),
        position: 'insideStartTop' as const,
        color: '#e8933a',
        fontSize: compact ? 9 : 10,
      },
      lineStyle: {
        color: '#e8933a',
        type: 'solid' as const,
        width: 1,
      },
    },
    (() => {
      const peak = getPeak()
      return {
        name: 'Peak',
        xAxis: peak?.date ?? '',
        label: {
          show: true,
          formatter: compact
            ? t('peak')
            : peak
              ? `${t('peak')} · ${fmtMAU(peak.mau)}`
              : t('peak'),
          position: 'insideStartTop' as const,
          color: '#ff6b6b',
          fontSize: compact ? 9 : 10,
        },
        lineStyle: {
          color: '#ff6b6b',
          type: 'dashed' as const,
          width: 1,
        },
      }
    })(),
  ]
}

function responsiveOverlay(width: number, t: Translator) {
  const compact = width < COMPACT_BREAKPOINT
  return {
    grid: {
      left: compact ? 12 : 56,
      right: compact ? 8 : 16,
      top: 18,
      bottom: compact ? 66 : 62,
    },
    xAxis: { axisLabel: { fontSize: compact ? 9 : 11 } },
    yAxis: { axisLabel: { fontSize: compact ? 9 : 12 } },
    dataZoom: [
      sliderConfig(compact),
      { type: 'inside' as const, moveOnTouchMove: !compact },
    ],
    series: [{ markLine: { data: buildMarkLineData(compact, t) } }],
  }
}

function sliderConfig(compact: boolean) {
  return {
    type: 'slider' as const,
    height: compact ? 34 : 30,
    bottom: compact ? 8 : 10,
    borderColor: '#316282',
    backgroundColor: 'rgba(22, 32, 45, 0.6)',
    fillerColor: 'rgba(102, 192, 244, 0.14)',
    dataBackground: {
      lineStyle: { color: '#2a3f5a' },
      areaStyle: { color: 'rgba(42, 63, 90, 0.25)' },
    },
    selectedDataBackground: {
      lineStyle: { color: '#66c0f4' },
      areaStyle: { color: 'rgba(102, 192, 244, 0.1)' },
    },
    handleStyle: {
      color: '#66c0f4',
      borderColor: '#a4d4f0',
      width: compact ? 18 : 14,
      height: compact ? 18 : 14,
    },
    moveHandleStyle: {
      color: '#66c0f4',
      size: compact ? 22 : 16,
    },
    textStyle: { color: '#8f98a0', fontSize: compact ? 10 : 11 },
  }
}

interface Props {
  records: MAURecord[]
}

export default function MAUChart({ records }: Props) {
  const { t, locale } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)
  const maxRef = useRef<number>(0)
  const widthBucketRef = useRef<'compact' | 'wide' | null>(null)
  const [activeRange, setActiveRange] = useState<RangeBtn>(null)
  const zoomingFromBtn = useRef(false)
  const snapRef = useRef(false)

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

  const handleRangeZoom = useCallback(
    (range: RangeBtn) => {
      const chart = chartRef.current
      if (!chart) return

      const lastDate = records[records.length - 1]?.date
      const firstDate = records[0]?.date
      if (!lastDate || !firstDate) return
      const lastTs = new Date(lastDate).getTime()

      let startDate: string
      let endDate: string
      switch (range) {
        case '1Y':
          startDate = new Date(lastTs - 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
          endDate = lastDate
          break
        case '2Y':
          startDate = new Date(lastTs - 2 * 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
          endDate = lastDate
          break
        case '3Y':
          startDate = new Date(lastTs - 3 * 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
          endDate = lastDate
          break
        case 'all':
          startDate = firstDate
          endDate = lastDate
          break
        case 'cs2':
          startDate = '2023-09-01'
          endDate = lastDate
          break
        case 'csgo':
          startDate = firstDate
          endDate = '2023-08-01'
          break
        default:
          return
      }

      // Records are always on the 1st of the month; snap the window start so
      // the first tick/label sits flush against the y-axis.
      startDate = `${startDate.slice(0, 7)}-01`

      zoomingFromBtn.current = true
      chart.dispatchAction({
        type: 'dataZoom',
        startValue: new Date(startDate).getTime(),
        endValue: new Date(endDate).getTime(),
      })
      setActiveRange(range)
    },
    [records],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const existing = getInstanceByDom(el)
    if (existing) existing.dispose()

    const chart = init(el, null, {
      // ECharts 6 runtime supports 'auto' (touch vs. mouse); public types only
      // declare boolean, so assert through unknown.
      useCoarsePointer: 'auto' as unknown as boolean,
      pointerSize: 52,
    })
    chartRef.current = chart

    const compact = el.clientWidth < COMPACT_BREAKPOINT
    widthBucketRef.current = compact ? 'compact' : 'wide'

    const initialMax = Math.max(...records.map((r) => r.mau)) * 1.1

    const option: Record<string, unknown> = {
      useUTC: true,
      grid: {
        left: compact ? 12 : 56,
        right: compact ? 8 : 16,
        top: 18,
        bottom: compact ? 66 : 62,
      },
      tooltip: {
        trigger: 'axis' as const,
        triggerOn: 'mousemove|click',
        confine: true,
        enterable: true,
        axisPointer: {
          type: 'cross' as const,
          snap: true,
          crossStyle: { color: '#66c0f4' },
        },
        backgroundColor: '#16202d',
        borderColor: '#2a3f5a',
        textStyle: { color: '#c6d4df', fontSize: 12 },
        padding: [6, 10],
        formatter: (params: Array<{
          axisValue: string
          seriesName: string
          value: [Date, number]
        }>) => {
          const p = params[0]
          if (!p) return ''
          const isCompactTip =
            (containerRef.current?.clientWidth ?? 0) < COMPACT_BREAKPOINT
          const fs = isCompactTip ? 10 : 13
          const d = new Date(p.axisValue)
          const fmt = (n: number) => n.toLocaleString('en-US')
          const record = records.find(
            (r) => new Date(r.date).getTime() === d.getTime(),
          )
          const dot = (color: string) =>
            `<span style="display:inline-block;width:${isCompactTip ? 6 : 8}px;height:${isCompactTip ? 6 : 8}px;border-radius:50%;background:${color};margin-right:${isCompactTip ? 4 : 6}px"></span>`
          return `<div style="font-size:${fs}px">
            <div style="color:#66c0f4;margin-bottom:${isCompactTip ? 2 : 4}px">${fmtDate(new Date(p.axisValue).toISOString(), locale)}</div>
            <div>${dot('#66c0f4')}${t('mau')}: <span style="font-family:monospace;color:#c6d4df">${fmt(p.value[1])}</span></div>
            ${params.length > 1 && params[1] ? `<div style="margin-top:${isCompactTip ? 1 : 2}px">${dot('#f5c542')}${t('avg6')}: <span style="font-family:monospace;color:#c6d4df">${fmt(params[1].value[1])}</span></div>` : ''}
            ${record ? `<div style="margin-top:${isCompactTip ? 2 : 4}px;color:#8f98a0;font-size:${isCompactTip ? 9 : fs}px">${record.game_version.toUpperCase()}</div>` : ''}
          </div>`
        },
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#2a3f5a' } },
        axisLabel: {
          color: '#8f98a0',
          fontSize: compact ? 9 : 11,
          hideOverlap: true,
          showMinLabel: true,
          showMaxLabel: true,
          alignMinLabel: 'left',
          alignMaxLabel: 'right',
          formatter: (value: number) => {
            const d = new Date(value)
            const year = d.getUTCFullYear()
            const month = d.getUTCMonth() + 1
            const day = d.getUTCDate()
            if (month === 1 && day === 1) return String(year)
            return `${year}/${String(month).padStart(2, '0')}`
          },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: initialMax,
        axisLabel: {
          color: '#8f98a0',
          fontSize: compact ? 9 : 12,
          formatter: (v: number) => fmtMAU(v),
        },
        splitLine: { lineStyle: { color: '#2a3f5a', type: 'dashed' as const } },
      },
      dataZoom: [
        {
          ...sliderConfig(compact),
          startValue: new Date(
            records[Math.max(0, records.length - 36)].date,
          ).getTime(),
          endValue: new Date(records[records.length - 1].date).getTime(),
        },
        { type: 'inside' as const, moveOnTouchMove: !compact },
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
            animation: false,
            data: buildMarkLineData(compact, t),
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
      const fromBtn = zoomingFromBtn.current
      if (!fromBtn) {
        setActiveRange(null)
      }
      zoomingFromBtn.current = false
      const opt = chart.getOption() as {
        dataZoom?: Array<{ startValue?: number; endValue?: number }>
      }
      const dz = opt.dataZoom?.[0]
      if (!dz || dz.startValue == null || dz.endValue == null) return
      const s = Number(dz.startValue)
      const e = Number(dz.endValue)

      // Snap each handle independently, without widening the selected range:
      // floor/ceil both edges would pull an inside boundary out to the nearest
      // enclosing monthly record on every side. Range buttons already use
      // exact record dates and pass through this branch unchanged.
      if (!fromBtn && !snapRef.current) {
        const sSnap = snapRecordTs(s, 'floor')
        const eSnap = snapRecordTs(e, 'floor')
        if (sSnap !== s || eSnap !== e) {
          snapRef.current = true
          chart.dispatchAction({
            type: 'dataZoom',
            startValue: sSnap,
            endValue: eSnap,
          })
          return
        }
      } else {
        snapRef.current = false
      }

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

    const snapRecordTs = (ts: number, dir: 'floor' | 'ceil') => {
      const times = records.map((r) => new Date(r.date).getTime())
      if (dir === 'floor') {
        let best = times[0]
        for (const t of times) {
          if (t <= ts) best = t
        }
        return best
      }
      for (const t of times) {
        if (t >= ts) return t
      }
      return times[times.length - 1]
    }

    // Responsive resize
    const ro = new ResizeObserver(() => {
      chart.resize()
      const next = el.clientWidth < COMPACT_BREAKPOINT ? 'compact' : 'wide'
      if (next !== widthBucketRef.current) {
        widthBucketRef.current = next
        chart.setOption(responsiveOverlay(el.clientWidth, t), {
          lazyUpdate: true,
        })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [records, mauData, ma6Data, t, locale])

  // Bottom stats (computed over ALL records, unaffected by brush)
  const maxMAU = getPeak()?.mau ?? 0
  const minMAU = getVersionMinMAU('cs2')
  const avgMAU = getAvgMAU() ?? 0
  const cs2Avg = getVersionAvgMAU('cs2')
  const csgoPeak = getVersionPeak('csgo')
  const cs2Peak = getVersionPeak('cs2')

  const startDate = records[0]?.date
  const endDate = records[records.length - 1]?.date
  const startYear = startDate ? startDate.slice(0, 4) : ''
  const endYear = endDate ? endDate.slice(0, 4) : ''

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-4 py-3 shadow-steam ring-1 ring-steam-border/50 sm:px-5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-steam-muted sm:text-sm">
            {t('chartTitle')}
          </p>
          <span className="text-xs text-steam-muted">
            {startYear} → {endYear} · {records.length} {t('monthsUnit')}
          </span>
        </div>

        {/* Quick range buttons */}
        <div className="mb-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
          {RANGE_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleRangeZoom(btn.key)}
              aria-pressed={activeRange === btn.key}
              className={`whitespace-nowrap rounded-sm px-2.5 py-2 text-xs transition-colors sm:px-2.5 sm:py-1 sm:text-sm ${
                activeRange === btn.key
                  ? 'bg-steam-control text-steam-text'
                  : 'bg-steam-card text-steam-muted hover:text-steam-text hover:bg-steam-control/50 ring-1 ring-steam-border/50'
              }`}
            >
              {btn.key === 'all' ? t('all') : btn.label}
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          className="h-[280px] sm:h-[340px]"
          style={{ width: '100%' }}
        />

        {/* Bottom stats */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-steam-border/50 pt-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t('peak')} value={fmtNum(maxMAU)} />
          <Stat label={t('cs2Peak')} value={fmtNum(cs2Peak)} />
          <Stat label={t('cs2Avg')} value={cs2Avg != null ? fmtNum(cs2Avg) : '—'} />
          <Stat label={t('cs2Lowest')} value={minMAU != null ? fmtNum(minMAU) : '—'} />
          <Stat label={t('average')} value={fmtNum(avgMAU)} />
          <Stat label={t('csgoPeak')} value={fmtNum(csgoPeak)} />
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="text-center sm:min-h-[46px]">
      <p className="text-xs uppercase tracking-wider text-steam-muted sm:text-sm">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-steam-text sm:text-base">
        {value}
      </p>
    </div>
  )
}
