# ECharts Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace visx-based MAUChart with ECharts 6 (tree-shaken) to fix crosshair misalignment, add adaptive y-axis, and use a mature visualization library. Also compress above-chart cards so the full chart fits one viewport.

**Architecture:** ECharts 6 tree-shaken via `lib/echarts.ts` (single registration entry). MAUChart uses `useRef<HTMLDivElement>` + `init()` in `useEffect` with a `dataZoom` event listener that recomputes the y-axis max from the visible range. All other components (Header/Footer/HeroSection/QuickStats/ChartSection/App) unchanged except for minor spacing compression on HeroSection (already committed), QuickStats, and ChartSection.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind 4, Apache ECharts 6.1.0 (tree-shaken — LineChart + Grid/Tooltip/DataZoom/MarkLine/CanvasRenderer), echarts/core `use`/`init`.

Confirmed exports (ECharts 6.1.0): `echarts/core` → `{ use, init, getInstanceByDom }`; `echarts/charts` → `{ LineChart, ... }`; `echarts/components` → `{ GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, ... }`; `echarts/renderers` → `{ CanvasRenderer }`.

## Global Constraints

- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`
- `noUnusedLocals` includes `noUnusedImports` (actually it doesn't, but the task must ensure no unused imports)
- No business logic in components — compute in `lib/` or `useMemo`
- Handle empty data (chart only renders when `records.length >= 2` via `ChartSection` guard)
- Conventional commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`
- ECharts Steam theme colors must match the existing `@theme` tokens (`steam-card: #16202d`, `steam-border: #2a3f5a`, `steam-blue: #66c0f4`, `steam-green: #a4d007`, `steam-text: #c6d4df`, `steam-muted: #8f98a0`, `steam-control: #316282`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/src/lib/echarts.ts` | Create | Tree-shaken ECharts module registration |
| `web/src/components/MAUChart.tsx` | Rewrite | ECharts chart (the core change) |
| `web/src/components/ChartBrush.tsx` | Delete | Replaced by ECharts dataZoom |
| `web/src/components/ChartTooltip.tsx` | Delete | Replaced by ECharts tooltip formatter |
| `web/src/hooks/useBrush.ts` | Delete | Replaced by ECharts dataZoom state management |
| `web/src/components/QuickStats.tsx` | Modify | Compress card padding `py-3→py-2`, container `mt-4→mt-3` |
| `web/src/components/ChartSection.tsx` | Modify | Wrapper `mt-6→mt-4`, chart height prop adjustment |
| `web/src/components/HeroSection.tsx` | Already committed in 2db7bcd | Compressed (mt-6→mt-4, gap-4→gap-3, card padding reduced, text sizes down) |
| `web/package.json` | Modify | Add `echarts ^6.1.0`, remove all `@visx/*`, `d3-scale`, `d3-shape`, `d3-time-format` |

---

### Task 1: ECharts scaffold — registration lib, package.json, delete old files

**Files:**
- Create: `web/src/lib/echarts.ts`
- Modify: `web/package.json`
- Delete: `web/src/components/ChartBrush.tsx`
- Delete: `web/src/components/ChartTooltip.tsx`
- Delete: `web/src/hooks/useBrush.ts`

**Interfaces:**
- Produces: ECharts 6.1.0 installed with tree-shaken modules registered; visx/d3 deps removed; 3 chart-support files deleted.

- [ ] **Step 1: Write `web/src/lib/echarts.ts`**

```typescript
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
])
```

- [ ] **Step 2: Edit `web/package.json`** — replace dependencies block

Remove from `dependencies`:
```
@visx/axis, @visx/brush, @visx/clip-path, @visx/event, @visx/group,
@visx/responsive, @visx/scale, @visx/shape, @visx/tooltip, @visx/xychart,
d3-scale, d3-shape, d3-time-format
```

Add to `dependencies`:
```json
"echarts": "^6.1.0"
```

The exact edit: replace all visx + d3 lines (13 packages) with one `echarts` line. Use the Edit tool targeting the specific JSON lines.

- [ ] **Step 3: Delete the 3 chart-support files**

```bash
git rm web/src/components/ChartBrush.tsx web/src/components/ChartTooltip.tsx web/src/hooks/useBrush.ts
```

- [ ] **Step 4: Install dependencies**

```bash
cd web && rm -rf node_modules package-lock.json && npm install
```

Expected: npm install succeeds, `echarts` is in node_modules, all `@visx/*` and `d3-*` are gone (except any used by other libs — verify with `ls node_modules/@visx 2>/dev/null || echo "visx removed"` and `ls node_modules/d3-scale 2>/dev/null || echo "d3-scale removed"`).

- [ ] **Step 5: Verify echarts imports resolve**

Run: `cd web && npx tsc --noEmit`. Expected: errors ONLY in MAUChart.tsx (still importing visx/d3 — fixed in Task 2). All other files must be type-clean. `lib/echarts.ts` must compile.

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/echarts.ts web/package.json
git commit -m "feat(web): add ECharts tree-shaken scaffold, remove visx/d3 deps"
```

---

### Task 2: Rewrite MAUChart.tsx (ECharts)

**Files:**
- Rewrite: `web/src/components/MAUChart.tsx`

**Interfaces:**
- Consumes: `MAURecord` from `../types`; `getPeak`/`getMinMAU`/`getAvgMAU`/`getVersionPeak` from `../lib/data`; `fmtNum`/`fmtMAU`/`fmtMonthShort` from `../lib/format`; ECharts types (`EChartsType` from `echarts`); ECharts instance API (`init`, `getInstanceByDom` from `echarts`).
- Produces: `<MAUChart records />` (Props unchanged: `{ records: MAURecord[] }`)

- [ ] **Step 1: Write MAUChart.tsx**

```typescript
import { useRef, useEffect, useMemo } from 'react'
import { init, getInstanceByDom } from 'echarts/core'
import type { EChartsType } from 'echarts'
import './lib/echarts' // registers modules at import time
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

  // Series data
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

  // Init chart
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Dispose stale instance on hot-reload
    const existing = getInstanceByDom(el)
    if (existing) existing.dispose()

    const chart = init(el)
    chartRef.current = chart

    // Build initial option
    const option: Record<string, unknown> = {
      grid: {
        left: 56,
        right: 16,
        top: 18,
        bottom: 56,
      },
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
          marker: string
        }>) => {
          const p = params[0]
          if (!p) return ''
          const d = new Date(p.axisValue)
          const fmt = (n: number) => n.toLocaleString('en-US')
          return `<div style="font-size:12px">
            <div style="color:#66c0f4;margin-bottom:4px">${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#66c0f4;margin-right:6px"></span>MAU: <span style="font-family:monospace;color:#c6d4df">${fmt(p.value[1])}</span></div>
            ${params.length > 1 ? `<div style="margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f5c542;margin-right:6px"></span>6mo avg: <span style="font-family:monospace;color:#c6d4df">${fmt(params[1].value[1])}</span></div>` : ''}
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
        axisLabel: {
          color: '#8f98a0',
          fontSize: 11,
          formatter: (v: number) => fmtMAU(v),
        },
        splitLine: { lineStyle: { color: '#2a3f5a', type: 'dashed' } },
        min: 0,
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
        {
          type: 'inside',
        },
      ],
      series: [
        {
          type: 'line',
          name: 'MAU',
          data: mauData,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#66c0f4', width: 1.5 },
          areaStyle: { color: areaGradient() },
          markLine: {
            symbol: 'none',
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
              lineStyle: { color: ev.color, type: 'dashed' as const, width: 1 },
            })),
          },
        },
        {
          type: 'line',
          name: '6-Month Avg',
          data: ma6Data,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#f5c542', width: 1, type: 'dashed' as const },
          areaStyle: undefined,
        },
      ],
    }

    chart.setOption(option)

    // Y-axis auto-adapt to visible range
    chart.on('dataZoom', () => {
      const opt = chart.getOption() as {
        dataZoom?: Array<{ start?: number; end?: number; startValue?: number; endValue?: number }>
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
        chart.setOption({ yAxis: { min: 0, max: nextMax } }, { silent: true })
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-4 py-5 shadow-steam ring-1 ring-steam-border/50 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-steam-muted">
            MAU History
          </p>
          <span className="text-xs text-steam-muted">
            {records.length} mo
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
```

- [ ] **Step 2: Verify tsc**

Run: `cd web && npx tsc --noEmit`

Expected: 0 errors. If ECharts types or import paths mismatch in 6.1.0, fix minimally (e.g., `getInstanceByDom` may be from `echarts/core` not `echarts`; verify via `node_modules/echarts/core.d.ts`). The exact import paths confirmed in investigation: `init` and `getInstanceByDom` are both exported from `echarts/core`. `echarts` package also exports `EChartsType` for the instance type reference.

- [ ] **Step 3: Build**

Run: `cd web && npm run build`

Expected: build succeeds. dist JS size ~250-300KB (tree-shaken ECharts, comparable to the visx build).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/MAUChart.tsx
git commit -m "feat(web): ECharts MAUChart with adaptive y-axis"
```

---

### Task 3: Compress QuickStats + ChartSection

**Files:**
- Modify: `web/src/components/QuickStats.tsx`
- Modify: `web/src/components/ChartSection.tsx`

**Interfaces:**
- Consumes: existing props (unchanged)
- Produces: same components, smaller visual footprint

- [ ] **Step 1: Edit QuickStats.tsx** — compress card padding and spacing

Change `py-3` → `py-2` on the Card div (line ~55). Change container `mt-4` → `mt-3` (line ~19).

```diff
-    <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
+    <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
       ...
-    <div className="rounded-sm bg-steam-card px-3 py-3 text-center ... ">
+    <div className="rounded-sm bg-steam-card px-3 py-2 text-center ... ">
```

- [ ] **Step 2: Edit ChartSection.tsx** — reduce wrapper margin

Change `mt-6` → `mt-4` on the outer div (both the empty-state and the MAUChart wrapper):

```diff
-    <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
+    <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
```

(two occurrences — the empty-state placeholder and the `<MAUChart>` wrapper in the App.tsx `mt-6` className is on the wrapper `<div className="mt-6">` around `ChartSection` — edit that in `App.tsx` too.)

Also in `App.tsx`:
```diff
-        <div className="mt-6">
+        <div className="mt-4">
```

- [ ] **Step 3: Verify tsc + build**

```bash
cd web && npx tsc --noEmit && npm run build
```

Expected: 0 errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/QuickStats.tsx web/src/components/ChartSection.tsx web/src/App.tsx
git commit -m "refactor(web): compress QuickStats and chart spacing for single-viewport fit"
```

---

### Task 4: Final verification + push

**Files:**
- none (verification only)

- [ ] **Step 1: Clean rebuild**

```bash
cd web && rm -rf node_modules package-lock.json && npm install && npm run build
```

Expected: clean install + successful build with ECharts. Confirm no visx/d3 packages in node_modules.

- [ ] **Step 2: Verify tsc clean**

```bash
cd web && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Dev server smoke test**

```bash
cd web && npm run dev
```

Open http://localhost:5173/. Verify:
- Chart renders with ECharts (a canvas element inside the container div)
- **Crosshair/pointer follows the mouse exactly** (problem 1 fixed — axisPointer snap)
- **Brush slider at bottom** — drag handles to zoom, confirm the y-axis re-scales to the visible data range (problem 2 fixed — dataZoom listener)
- **Event lines** (CS:GO, F2P, CS2 Ann., CS2) visible as dashed vertical lines with labels
- **Tooltip** shows date, MAU, 6-month avg, game_version on hover
- HeroSection, QuickStats are compressed compared to before

- [ ] **Step 4: Bundle check**

```bash
cd web && ls -la dist/assets/*.js dist/assets/*.css
```

Compare: JS bundle ~250-300KB, CSS ~15KB.

- [ ] **Step 5: Commit + push**

```bash
git add -A && git status  # verify no node_modules/dist/data/archive staged
git commit -m "chore: final ECharts migration verification"
git push
```
