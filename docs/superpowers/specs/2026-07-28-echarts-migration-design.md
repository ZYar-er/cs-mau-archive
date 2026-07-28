# CS MAU Chart — ECharts Migration + Polish

**Date**: 2026-07-28
**Status**: approved

## Overview

Replace the visx-based MAUChart with Apache ECharts 6 (tree-shaken) to fix three issues: (1) event/crosshair lines not aligned with the cursor, (2) y-axis not auto-adapting to the brush selection, (3) move to a mature visualization library. Also compress the above-chart cards so the chart fits one viewport.

## Root Causes of the Three Issues (visx)

1. **Crosshair misalignment**: `onMove` (MAUChart.tsx:125) reads `e.currentTarget.getBoundingClientRect()` from the hover-capture `<rect>`, which lives inside `<Group left={margin.left}>` — its `.left` already includes the margin. Subtracting `margin.left` again shifts the crosshair ~56px left of the cursor.
2. **Y-axis static**: `maxMAU` (MAUChart.tsx:102) is computed over **all** records; `yScale` domain is fixed `[0, maxMAU * 1.1]`. Brushing to an early low-MAU range keeps the global peak scale, flattening the line.
3. **Library**: visx is low-level; brush/tooltip/event-lines are all hand-rolled. ECharts ships these natively.

## Architecture

```
App
├── Header
├── HeroSection        # COMPRESSED (smaller cards so chart fits one page)
├── QuickStats         # COMPRESSED
├── ChartSection       # < 2 guard (unchanged)
│   └── MAUChart       # REWRITE: ECharts
└── Footer
```

Data layer (`lib/data.ts`), types, format lib, Header/Footer, App root — **unchanged**. Only MAUChart + the chart-support files are touched.

## ECharts Integration (tree-shaken)

New file `web/src/lib/echarts.ts` — single registration entry:

```typescript
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart, GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, CanvasRenderer,
])
```

MAUChart imports `./lib/echarts` once. Renderer: **Canvas** (good for 154 points + drag).

## Solving the Three Issues

**Issue 1 — aligned crosshair:** ECharts `tooltip.trigger: 'axis'` + `axisPointer: { type: 'cross', snap: true }`. `snap: true` snaps to the nearest data point; the crosshair aligns exactly with the cursor x while locking to data. No manual coordinate math → no margin double-subtraction bug.

**Issue 2 — y-axis auto-adapts:** Listen to `chart.on('dataZoom')`. On each event, read the visible range (`startValue`/`endValue` from the slider), compute `visibleMax` over the in-range records, and call `setOption({ yAxis: { min: 0, max: visibleMax * 1.1 } }, { silent: true })`. `silent: true` prevents a reentrant `dataZoom` event. Guard against no-op (skip if max unchanged) to avoid loops. This is the standard ECharts pattern for y-axis-follows-brush.

**Issue 3 — library swap:** brush = `dataZoom` (slider + inside, native, smooth), event lines = `markLine` (`{ xAxis: dateString }`, data-driven, auto-positioned when brushing — no hiding bug), tooltip = `formatter`.

## ECharts option skeleton

```typescript
{
  grid: { left: 56, right: 16, top: 16, bottom: 60 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross', snap: true },
    backgroundColor: '#16202d', borderColor: '#2a3f5a',
    textStyle: { color: '#c6d4df' },
    formatter: <(params) => date + MAU + 6mo avg + version>,
  },
  xAxis: { type: 'time', axisLabel: { color: '#8f98a0', fontSize: 10 } },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#8f98a0', formatter: fmtMAU },
    // min/max set dynamically by dataZoom handler (see Issue 2)
  },
  dataZoom: [
    { type: 'slider', start: <last 36 months as %>, height: 28, bottom: 8,
      borderColor: '#316282', fillerColor: 'rgba(102,192,244,0.08)',
      handleStyle: { color: '#66c0f4' }, textStyle: { color: '#8f98a0' } },
    { type: 'inside' },
  ],
  series: [
    {
      type: 'line', name: 'MAU',
      data: <[Date, number][]>,
      smooth: true,
      lineStyle: { color: '#66c0f4', width: 1.5 },
      areaStyle: { color: <linear gradient #66c0f4 25%→2%> },
      markLine: {
        symbol: 'none',
        data: EVENTS.map(ev => ({ xAxis: ev.date, label: { show: true, formatter: ev.label } })),
        lineStyle: { type: 'dashed', color: <per-event> },
      },
    },
    {
      type: 'line', name: '6-Month Avg',
      data: <[Date, number|null][]> (filtered, connectNulls false),
      smooth: true,
      lineStyle: { color: '#f5c542', width: 1, type: 'dashed' },
    },
  ],
}
```

EVENTS constant (moved into MAUChart): the 4 events (CS:GO / F2P / CS2 Ann. / CS2) as ISO date strings for `xAxis` time-axis matching.

## Component Interface (unchanged)

```typescript
interface Props { records: MAURecord[] }
export default function MAUChart({ records }: Props) { ... }
```

ChartSection still guards `records.length < 2` → "Not enough data". App root unchanged.

## MAUChart implementation

- `useRef<HTMLDivElement>` container; `useEffect` creates `echarts.init(container)`, builds `setOption(option)`, attaches the `dataZoom` listener for y-axis auto-adapt, sets up a `ResizeObserver` to call `chart.resize()`.
- `useMemo` for series data: `records.map(r => [new Date(r.date), r.mau])` and the 6-month moving average.
- `getPeak`/`getMinMAU`/`getAvgMAU`/`getVersionPeak` from `lib/data` feed the bottom Stat row (computed over all records, not affected by brush).
- Dispose chart on unmount.

## Y-axis auto-adapt (the one fiddly bit)

```typescript
chart.on('dataZoom', () => {
  const opt = chart.getOption() as any
  const dz = opt.dataZoom[0]
  // time axis: startValue/endValue are timestamps
  const [s, e] = [Number(dz.startValue), Number(dz.endValue)]
  const visible = records.filter(r => {
    const t = new Date(r.date).getTime()
    return t >= s && t <= e
  })
  const visibleMax = Math.max(...visible.map(r => r.mau), 0)
  const nextMax = visibleMax * 1.1
  if (nextMax !== curMaxRef.current) {
    curMaxRef.current = nextMax
    chart.setOption({ yAxis: { min: 0, max: nextMax } }, { silent: true })
  }
})
```

`curMaxRef` tracks the last applied max to skip no-op updates (prevents feedback loops).

## Layout compression (so chart fits one viewport)

- **HeroSection**: `mt-6→mt-4`, `gap-4→gap-3`, hero `py-6→py-4 px-6→px-5`, MAU `text-6xl→text-5xl` (sm), meta cards `py-4→py-3 px-5→px-4`, title `text-2xl→text-xl`, sidebar `lg:w-80→lg:w-72`.
- **QuickStats**: `mt-4→mt-3`, card `py-3→py-2`.
- **MAUChart container**: `height: 480 → 420`.

(App's `mt-6` wrapper around ChartSection becomes `mt-4`.)

## Files

| File | Action |
|---|---|
| `web/src/lib/echarts.ts` | Create (tree-shaken registration) |
| `web/src/components/MAUChart.tsx` | Rewrite (ECharts) |
| `web/src/components/ChartBrush.tsx` | Delete (ECharts dataZoom replaces) |
| `web/src/components/ChartTooltip.tsx` | Delete (ECharts tooltip replaces) |
| `web/src/hooks/useBrush.ts` | Delete (ECharts manages brush state) |
| `web/src/components/HeroSection.tsx` | Modify (compress per above) |
| `web/src/components/QuickStats.tsx` | Modify (compress) |
| `web/src/components/ChartSection.tsx` | Modify (mt-6→mt-4 wrapper, height prop if needed) |
| `web/package.json` | Add `echarts ^6`, remove `@visx/*`, `d3-scale`, `d3-shape`, `d3-time-format` |
| `web/src/lib/format.ts` | Keep (`fmtMAU`, `fmtMonthShort` used by axis/tooltip) |
| Others | Unchanged |

## Tech Stack

React 19, TypeScript 6, Vite 8, Tailwind 4 (Steam theme), Apache ECharts 6 (tree-shaken — LineChart + Grid/Tooltip/DataZoom/MarkLine components, Canvas renderer).

## Error Handling

- `ChartSection` `< 2` guard unchanged.
- `App` empty-data guard unchanged.
- MAUChart: if `records.length < 2` it's never mounted (guard upstream).
- ECharts init in `useEffect` with cleanup `chart.dispose()` to prevent leaks on re-render/unmount.