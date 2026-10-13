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
import { fmtNum, fmtMAU, fmtMonth, fmtGameVersion } from '../lib/format'
import { useI18n, type Translator } from '../lib/i18n'

const EVENTS = [
  { date: '2012-08-21', labelKey: 'eventCsgo', tone: 0 },
  { date: '2018-12-06', labelKey: 'eventF2p', tone: 1 },
  { date: '2023-03-22', labelKey: 'eventCs2Ann', tone: 2 },
  { date: '2023-09-27', labelKey: 'eventCs2', tone: 2 },
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

/**
 * Every colour this chart draws with.
 *
 * Behaviour — zoom, snapping, the auto-adapting y-axis, tooltip, range buttons
 * and bottom stats — is deliberately not parameterised. A style variant passes
 * a theme and gets a re-skinned chart with identical functionality; anything
 * structural lives here, not in the theme.
 *
 * The DOM chrome (title, range buttons, stats) is themed from CSS instead, via
 * the `mau-chart-*` hook classes on the markup below.
 */
export interface ChartTheme {
  series: {
    color: string
    width: number
    smooth: boolean
    /** A flat colour string, or an ECharts gradient object. */
    area: string | Record<string, unknown>
  }
  average: { color: string; width: number }
  axis: {
    line: string
    label: string
    split: string
    splitType: 'solid' | 'dashed'
    /** Crosshair of the axis pointer. */
    cursor: string
  }
  tooltip: {
    bg: string
    border: string
    text: string
    /** Trailing `month · game version` line. */
    muted: string
    dotRadius: string
  }
  markers: {
    /** One colour per `EVENTS[].tone`. */
    tones: [string, string, string]
    csgoPeak: string
    peak: string
  }
  slider: {
    border: string
    background: string
    filler: string
    trackLine: string
    trackArea: string
    selectedLine: string
    selectedArea: string
    handle: string
    handleBorder: string
    /**
     * Optional ECharts `path://` for the drag handles. Omit to keep ECharts'
     * default rounded grip; themes that forbid radii can supply a square one.
     */
    handleIcon?: string
    text: string
  }
}

/**
 * The shipping palette: Steam classic dark / Library.
 *
 * Chrome follows the colour card (#232730 for the marker, #adadad for labels
 * and strokes, #66c0f4 for the interaction blue). The categorical accents —
 * the 6-month average, the four event tones, the CS:GO and all-time peaks —
 * are data colours, not chrome, so they keep their hues; the lines that were
 * a blue-tinted #2a3f5a become #adadad at low alpha so they read as neutral
 * hairlines on the new background. Kept in step with src/index.css.
 */
export const STEAM_THEME: ChartTheme = {
  series: {
    color: '#66c0f4',
    width: 1.5,
    smooth: true,
    area: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: 'rgba(102, 192, 244, 0.25)' },
        { offset: 1, color: 'rgba(102, 192, 244, 0.02)' },
      ],
    },
  },
  average: { color: '#f5c542', width: 1 },
  axis: {
    line: 'rgba(173, 173, 173, 0.25)',
    label: '#adadad',
    split: 'rgba(173, 173, 173, 0.12)',
    splitType: 'dashed',
    cursor: '#66c0f4',
  },
  tooltip: {
    bg: '#232730',
    border: 'rgba(173, 173, 173, 0.25)',
    text: '#c6d4df',
    muted: '#adadad',
    dotRadius: '50%',
  },
  markers: {
    tones: ['#f5c542', '#d97ed9', '#a4d007'],
    csgoPeak: '#e8933a',
    peak: '#ff6b6b',
  },
  slider: {
    border: 'rgba(173, 173, 173, 0.25)',
    background: 'rgba(35, 39, 48, 0.6)',
    filler: 'rgba(102, 192, 244, 0.14)',
    trackLine: 'rgba(173, 173, 173, 0.2)',
    trackArea: 'rgba(173, 173, 173, 0.06)',
    selectedLine: '#66c0f4',
    selectedArea: 'rgba(102, 192, 244, 0.1)',
    handle: '#66c0f4',
    handleBorder: '#a4d4f0',
    text: '#adadad',
  },
}

function movingAvg(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    const slice = data.slice(i - window + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b, 0) / window)
  })
}

function buildMarkLineData(
  compact: boolean,
  t: Translator,
  theme: ChartTheme,
) {
  const csgoPeak = getVersionPeakRecord('csgo')
  return [
    ...EVENTS.map((ev) => ({
      xAxis: ev.date,
      label: {
        show: compact ? ev.labelKey !== 'eventCs2Ann' : true,
        formatter: t(ev.labelKey),
        position: 'insideEndTop' as const,
        color: theme.markers.tones[ev.tone],
        fontSize: compact ? 9 : 10,
      },
      lineStyle: {
        color: theme.markers.tones[ev.tone],
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
        color: theme.markers.csgoPeak,
        fontSize: compact ? 9 : 10,
      },
      lineStyle: {
        color: theme.markers.csgoPeak,
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
          color: theme.markers.peak,
          fontSize: compact ? 9 : 10,
        },
        lineStyle: {
          color: theme.markers.peak,
          type: 'dashed' as const,
          width: 1,
        },
      }
    })(),
  ]
}

function responsiveOverlay(width: number, t: Translator, theme: ChartTheme) {
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
      sliderConfig(compact, theme),
      { type: 'inside' as const, moveOnTouchMove: !compact },
    ],
    series: [{ markLine: { data: buildMarkLineData(compact, t, theme) } }],
  }
}

function sliderConfig(compact: boolean, theme: ChartTheme) {
  return {
    type: 'slider' as const,
    height: compact ? 34 : 30,
    bottom: compact ? 8 : 10,
    borderColor: theme.slider.border,
    backgroundColor: theme.slider.background,
    fillerColor: theme.slider.filler,
    dataBackground: {
      lineStyle: { color: theme.slider.trackLine },
      areaStyle: { color: theme.slider.trackArea },
    },
    selectedDataBackground: {
      lineStyle: { color: theme.slider.selectedLine },
      areaStyle: { color: theme.slider.selectedArea },
    },
    handleStyle: {
      color: theme.slider.handle,
      borderColor: theme.slider.handleBorder,
      width: compact ? 18 : 14,
      height: compact ? 18 : 14,
    },
    moveHandleStyle: {
      color: theme.slider.handle,
      size: compact ? 22 : 16,
    },
    textStyle: { color: theme.slider.text, fontSize: compact ? 10 : 11 },
    // Spread rather than assign, so an unset icon leaves the key absent and
    // ECharts keeps its own default.
    ...(theme.slider.handleIcon ? { handleIcon: theme.slider.handleIcon } : {}),
  }
}

interface Props {
  records: MAURecord[]
  /** Defaults to the shipping Steam palette. See `ChartTheme`. */
  theme?: ChartTheme
}

export default function MAUChart({ records, theme = STEAM_THEME }: Props) {
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
          crossStyle: { color: theme.axis.cursor },
        },
        backgroundColor: theme.tooltip.bg,
        borderColor: theme.tooltip.border,
        textStyle: { color: theme.tooltip.text, fontSize: 12 },
        // Tooltip layout is settled: figures on top, then the month and the
        // game version sharing one trailing line. Both themes render exactly
        // this — only the colours differ. Don't restyle or reorder it unless
        // the data model changes.
        padding: [5, 8],
        formatter: (params: Array<{
          axisValue: string
          seriesName: string
          value: [Date, number]
        }>) => {
          const p = params[0]
          if (!p) return ''
          const narrow =
            (containerRef.current?.clientWidth ?? 0) < COMPACT_BREAKPOINT
          const fs = narrow ? 10 : 11
          const d = new Date(p.axisValue)
          const fmt = (n: number) => n.toLocaleString('en-US')
          const record = records.find(
            (r) => new Date(r.date).getTime() === d.getTime(),
          )
          const dot = (color: string) =>
            `<span style="display:inline-block;width:${narrow ? 6 : 8}px;height:${narrow ? 6 : 8}px;border-radius:${theme.tooltip.dotRadius};background:${color};margin-right:${narrow ? 4 : 6}px"></span>`
          const figure = `font-variant-numeric:tabular-nums;color:${theme.tooltip.text}`
          const month = fmtMonth(d.toISOString(), locale)
          const meta = record
            ? `${month} · ${fmtGameVersion(record.game_version)}`
            : month
          return `<div style="font-size:${fs}px">
            <div>${dot(theme.series.color)}${t('mauShort')}: <span style="${figure}">${fmt(p.value[1])}</span></div>
            ${params.length > 1 && params[1] ? `<div style="margin-top:1px">${dot(theme.average.color)}${t('avg6Short')}: <span style="${figure}">${fmt(params[1].value[1])}</span></div>` : ''}
            <div style="margin-top:${narrow ? 3 : 5}px;color:${theme.tooltip.muted}">${meta}</div>
          </div>`
        },
      },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: theme.axis.line } },
        axisLabel: {
          color: theme.axis.label,
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
          color: theme.axis.label,
          fontSize: compact ? 9 : 12,
          formatter: (v: number) => fmtMAU(v),
        },
        splitLine: {
          lineStyle: { color: theme.axis.split, type: theme.axis.splitType },
        },
      },
      dataZoom: [
        {
          ...sliderConfig(compact, theme),
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
          smooth: theme.series.smooth,
          symbol: 'none' as const,
          lineStyle: { color: theme.series.color, width: theme.series.width },
          areaStyle: { color: theme.series.area },
          markLine: {
            symbol: 'none' as const,
            silent: true,
            animation: false,
            data: buildMarkLineData(compact, t, theme),
          },
        },
        {
          type: 'line',
          name: '6-Month Avg',
          data: ma6Data,
          smooth: theme.series.smooth,
          symbol: 'none' as const,
          lineStyle: {
            color: theme.average.color,
            width: theme.average.width,
            type: 'dashed' as const,
          },
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
        chart.setOption(responsiveOverlay(el.clientWidth, t, theme), {
          lazyUpdate: true,
        })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.dispose()
    }
  }, [records, mauData, ma6Data, t, locale, theme])

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
    <div className="mau-chart-shell mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mau-chart-card rounded-sm bg-steam-card px-4 py-3 shadow-steam ring-1 ring-steam-border/50 sm:px-5">
        <div className="mau-chart-head mb-2.5 flex items-center justify-between">
          <p className="mau-chart-title text-xs uppercase tracking-wider text-steam-muted sm:text-sm">
            {t('chartTitle')}
          </p>
          <span className="mau-chart-meta text-xs text-steam-muted">
            {startYear} → {endYear} · {records.length} {t('monthsUnit')}
          </span>
        </div>

        {/* Quick range buttons */}
        <div className="mau-chart-ranges mb-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
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
          className="mau-chart-canvas h-[280px] sm:h-[340px]"
          style={{ width: '100%' }}
        />

        {/* Bottom stats */}
        <div className="mau-chart-stats mt-2.5 grid grid-cols-2 gap-2 border-t border-steam-border/50 pt-2.5 sm:grid-cols-3 lg:grid-cols-6">
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
    <div className="mau-chart-stat text-center sm:min-h-[46px]">
      <p className="mau-chart-stat-label text-xs uppercase tracking-wider text-steam-muted sm:text-sm">
        {label}
      </p>
      <p className="mau-chart-stat-value mt-0.5 text-sm font-semibold tabular-nums text-steam-text sm:text-base">
        {value}
      </p>
    </div>
  )
}
