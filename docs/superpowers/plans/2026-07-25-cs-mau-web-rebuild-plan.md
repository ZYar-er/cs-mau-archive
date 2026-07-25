# CS MAU Archive Web Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the CS MAU web visualization from scratch — React 19 + Vite 8 + Tailwind CSS 4 + Recharts 3, Steam dark theme, single-chart multi-info layout.

**Architecture:** `data/index.ts` is the sole data layer (merge JSON + compute stats). `App.tsx` wires components and handles empty-state. Each component receives props only, no internal business logic.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Recharts 3

## Global Constraints

- All files are under `web/`
- Steam theme colors defined in CSS `@theme` block
- `@import 'tailwindcss'` (Tailwind v4 syntax)
- `verbatimModuleSyntax: true` (use `import type` for type-only imports)
- `noUnusedLocals: true`, `noUnusedParameters: true`
- All Recharts animations disabled (`isAnimationActive={false}`)
- No business logic in components — compute in data layer or App
- Handle empty data at every level (data layer → App → chart)

---

## File Map

| File | Create/Modify | Responsibility |
|---|---|---|
| `web/package.json` | Overwrite | Project config + scripts |
| `web/vite.config.ts` | Overwrite | Vite + Tailwind plugin |
| `web/tsconfig.json` | Overwrite | TypeScript config |
| `web/.gitignore` | Overwrite | Ignore node_modules, dist, src/data/ |
| `web/index.html` | Overwrite | HTML entry point |
| `web/public/favicon.svg` | Create | SVG favicon |
| `web/scripts/copy-data.mjs` | Create | Copy data from root to src |
| `web/src/index.css` | Create | Tailwind import + Steam theme |
| `web/src/main.tsx` | Create | React entry point |
| `web/src/types.ts` | Create | MAURecord interface |
| `web/src/data/index.ts` | Create | Data merge + compute exports |
| `web/src/components/Header.tsx` | Create | Top nav bar |
| `web/src/components/Footer.tsx` | Create | Bottom bar |
| `web/src/components/HeroSection.tsx` | Create | MAU hero card + meta |
| `web/src/components/QuickStats.tsx` | Create | Mini stat cards grid |
| `web/src/components/ChartSection.tsx` | Create | Chart + empty guard |
| `web/src/components/MAUChart.tsx` | Create | Core Recharts chart |
| `web/src/App.tsx` | Create | Root component |

---

### Task 1: Project Scaffold

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/.gitignore`
- Create: `web/index.html`
- Create: `web/public/favicon.svg`

**Interfaces:**
- Produces: Vite + React + Tailwind project ready for `npm install && npm run dev`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "cs-mau-archive",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "predev": "node scripts/copy-data.mjs",
    "dev": "vite",
    "prebuild": "node scripts/copy-data.mjs",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.3.3",
    "typescript": "~6.0.2",
    "vite": "^8.1.1"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "recharts": "^3.10.0"
  }
}
```

- [ ] **Step 2: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write .gitignore**

```
node_modules
dist
*.local
src/data/
```

- [ ] **Step 5: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CS2 MAU Tracker</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="7" stroke="#66c0f4" stroke-width="0.5"/>
  <path d="M6 5l4.5 3L6 11V5z" fill="#66c0f4"/>
</svg>
```

- [ ] **Step 7: Write scripts/copy-data.mjs**

```javascript
import { cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const src = resolve(root, 'data')
const dest = resolve(root, 'web', 'src', 'data')

cpSync(src, dest, { recursive: true })

const historyFile = resolve(dest, 'history.json')
if (!existsSync(historyFile)) {
  writeFileSync(historyFile, '[]\n')
} else {
  try {
    const content = JSON.parse(readFileSync(historyFile, 'utf-8'))
    if (!Array.isArray(content)) {
      writeFileSync(historyFile, '[]\n')
    }
  } catch {
    writeFileSync(historyFile, '[]\n')
  }
}

console.log('Data files synced.')
```

- [ ] **Step 8: Install dependencies and verify scaffold**

```bash
cd web && npm install
```

- [ ] **Step 9: Commit**

```bash
git add web/package.json web/vite.config.ts web/tsconfig.json web/.gitignore web/index.html web/public/favicon.svg web/scripts/copy-data.mjs
git commit -m "feat: scaffold web project"
```

---

### Task 2: Theme, Types, and Entry Point

**Files:**
- Create: `web/src/index.css`
- Create: `web/src/types.ts`
- Create: `web/src/main.tsx`

**Interfaces:**
- Consumes: Vite + Tailwind from Task 1
- Produces:
  - `MAURecord` type (imported by all other src files)
  - Steam theme CSS classes (used by all components)
  - `<App>` mounted into `#app`

- [ ] **Step 1: Write src/index.css**

```css
@import 'tailwindcss';

@theme {
  --color-steam-nav: #171a21;
  --color-steam-bg: #1b2838;
  --color-steam-card: #16202d;
  --color-steam-border: #2a3f5a;
  --color-steam-blue: #66c0f4;
  --color-steam-green: #a4d007;
  --color-steam-text: #c6d4df;
  --color-steam-muted: #8f98a0;
  --color-steam-control: #316282;
  --shadow-steam: 0 1px 3px rgb(0 0 0 / 0.3);
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: var(--color-steam-bg);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-steam-nav);
}
::-webkit-scrollbar-thumb {
  background: var(--color-steam-border);
  border-radius: 4px;
}
```

- [ ] **Step 2: Write src/types.ts**

```typescript
export interface MAURecord {
  date: string
  mau: number
  game_version: string
  source: string
  api_timestamp?: string
  wayback_timestamp?: string
}
```

- [ ] **Step 3: Write src/main.tsx**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Copy data files and verify build**

```bash
cd web && npm run predev && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add web/src/index.css web/src/types.ts web/src/main.tsx
git commit -m "feat: add theme, types, and entry point"
```

---

### Task 3: Data Layer

**Files:**
- Create: `web/src/data/index.ts`

**Interfaces:**
- Consumes: `MAURecord` from `src/types.ts`
- Produces:
  - `getAll(): MAURecord[]` — all records sorted by date
  - `getLatest(): MAURecord | null` — most recent record
  - `getYoYGrowth(): string | null` — year-over-year growth %
  - `getPeak(): MAURecord | null` — record with highest MAU
  - `getMinMAU(): number | null` — lowest MAU
  - `getAvgMAU(): number | null` — mean MAU
  - `getVersionPeak(version: string): number` — peak for a game_version
  - `getCount(): number` — total records

- [ ] **Step 1: Write src/data/index.ts**

```typescript
import type { MAURecord } from '../types'
import dailyJson from './daily.json'
import historyJson from './history.json'

const dailyRecords = (dailyJson as MAURecord[]).slice()
const historyRecords = (historyJson as MAURecord[]).slice()

const deduped = new Map<string, MAURecord>()

for (const r of historyRecords) {
  deduped.set(r.date, r)
}

for (const r of dailyRecords) {
  // Daily data is always the latest source, overwrite anything else
  deduped.set(r.date, r)
}

const records: MAURecord[] = Array.from(deduped.values()).sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
)

export function getAll(): MAURecord[] {
  return records
}

export function getLatest(): MAURecord | null {
  if (records.length === 0) return null
  return records[records.length - 1]
}

export function getCount(): number {
  return records.length
}

export function getYoYGrowth(): string | null {
  const latest = getLatest()
  if (!latest || records.length < 2) return null

  const prevYear = records.find(
    (r) =>
      r.date.slice(0, 7) ===
      `${Number(latest.date.slice(0, 4)) - 1}-${latest.date.slice(5, 7)}`,
  )
  if (!prevYear) return null

  return (((latest.mau - prevYear.mau) / prevYear.mau) * 100).toFixed(1)
}

export function getPeak(): MAURecord | null {
  if (records.length === 0) return null
  return records.reduce((a, b) => (b.mau > a.mau ? b : a))
}

export function getMinMAU(): number | null {
  if (records.length === 0) return null
  return Math.min(...records.map((r) => r.mau))
}

export function getAvgMAU(): number | null {
  if (records.length === 0) return null
  return Math.round(records.reduce((s, r) => s + r.mau, 0) / records.length)
}

export function getVersionPeak(version: string): number {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return 0
  return Math.max(...versionRecords.map((r) => r.mau))
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add web/src/data/index.ts
git commit -m "feat: add data layer with merge and compute exports"
```

---

### Task 4: Header and Footer

**Files:**
- Create: `web/src/components/Header.tsx`
- Create: `web/src/components/Footer.tsx`

**Interfaces:**
- Consumes: Steam theme CSS classes
- Produces:
  - `<Header />` — static, no props
  - `<Footer />` — static, no props

- [ ] **Step 1: Write src/components/Header.tsx**

```typescript
export default function Header() {
  return (
    <header className="bg-steam-nav shadow-steam">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="#66c0f4" strokeWidth="0.5" />
            <path d="M6 5l4.5 3L6 11V5z" fill="#66c0f4" />
          </svg>
          <span className="text-base font-semibold uppercase tracking-wider text-steam-text">
            CS2 MAU Tracker
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-steam-muted">
          <span>Steam Web API</span>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write src/components/Footer.tsx**

```typescript
export default function Footer() {
  return (
    <footer className="border-t border-steam-border/50 bg-steam-nav">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-steam-muted">
        <span>Data via Steam Web API &amp; Wayback Machine</span>
        <span>CS2 MAU Archive &copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/Header.tsx web/src/components/Footer.tsx
git commit -m "feat: add Header and Footer components"
```

---

### Task 5: HeroSection

**Files:**
- Create: `web/src/components/HeroSection.tsx`

**Interfaces:**
- Consumes: `MAURecord` from types, `getCount` from data
- Produces: `<HeroSection latest count yoyGrowth />`
- Props: `{ latest: MAURecord; yoyGrowth: string | null; count: number }`

- [ ] **Step 1: Write src/components/HeroSection.tsx**

```typescript
import type { MAURecord } from '../types'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

interface Props {
  latest: MAURecord
  yoyGrowth: string | null
  count: number
}

export default function HeroSection({ latest, yoyGrowth, count }: Props) {
  const startYear = count > 0 ? '2013' : null // first data year is known
  const endYear = new Date(latest.date).getFullYear()

  return (
    <div className="mx-auto mt-8 max-w-7xl px-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Hero MAU */}
        <div className="flex-1 rounded-sm bg-gradient-to-b from-steam-card to-steam-bg px-6 py-6 shadow-steam ring-1 ring-steam-border/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-steam-muted">
            Monthly Active Users
          </p>
          <p className="text-5xl font-bold tracking-tight text-steam-blue sm:text-6xl">
            {formatNumber(latest.mau)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-steam-muted">
            <span>as of {formatDate(latest.date)}</span>
            {yoyGrowth && (
              <span
                className={
                  Number(yoyGrowth) >= 0 ? 'text-steam-green' : 'text-red-400'
                }
              >
                {Number(yoyGrowth) >= 0 ? '+' : ''}
                {yoyGrowth}% YoY
              </span>
            )}
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="flex flex-col gap-4 sm:flex-row lg:w-72 lg:flex-col">
          <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
            <p className="text-xs uppercase tracking-wider text-steam-muted">
              Game
            </p>
            <p className="mt-1 text-2xl font-bold uppercase tracking-wide text-steam-text">
              {latest.game_version}
            </p>
            <p className="mt-1 text-xs text-steam-muted">
              source: {latest.source}
            </p>
          </div>
          <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
            <p className="text-xs uppercase tracking-wider text-steam-muted">
              Archive
            </p>
            <p className="mt-1 text-2xl font-bold text-steam-text">{count}</p>
            <p className="mt-1 text-xs text-steam-muted">
              records · {startYear}–{endYear}
            </p>
          </div>
          {latest.api_timestamp && (
            <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
              <p className="text-xs uppercase tracking-wider text-steam-muted">
                API Updated
              </p>
              <p className="mt-1 text-sm font-medium text-steam-text">
                {formatTimestamp(latest.api_timestamp)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/HeroSection.tsx
git commit -m "feat: add HeroSection component"
```

---

### Task 6: QuickStats

**Files:**
- Create: `web/src/components/QuickStats.tsx`

**Interfaces:**
- Consumes: `MAURecord`, data-layer functions (`getPeak`, `getAvgMAU`, `getVersionPeak`, `getYoYGrowth`)
- Produces: `<QuickStats records />`
- Props: `{ records: MAURecord[] }`

- [ ] **Step 1: Write src/components/QuickStats.tsx**

```typescript
import type { MAURecord } from '../types'
import { getPeak, getAvgMAU, getVersionPeak, getYoYGrowth } from '../data'

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

interface Props {
  records: MAURecord[]
}

export default function QuickStats({ records }: Props) {
  const peak = getPeak()?.mau ?? 0
  const avg = getAvgMAU() ?? 0
  const latest = records[records.length - 1]?.mau ?? 0
  const cs2Peak = getVersionPeak('cs2')
  const yoy = getYoYGrowth()
  const peakYear = getPeak()?.date.slice(0, 4) ?? ''

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card label="Peak" value={formatNumber(peak)} sub={peakYear} />
        <Card label="Average" value={formatNumber(avg)} />
        <Card label="Latest" value={formatNumber(latest)} />
        <Card
          label="CS2 Peak"
          value={formatNumber(cs2Peak)}
          color="text-steam-green"
        />
        {yoy && (
          <Card
            label="YoY"
            value={`${Number(yoy) >= 0 ? '+' : ''}${yoy}%`}
            color={Number(yoy) >= 0 ? 'text-steam-green' : 'text-red-400'}
          />
        )}
      </div>
    </div>
  )
}

function Card({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-sm bg-steam-card px-4 py-3 text-center shadow-steam ring-1 ring-steam-border/50">
      <p className="text-xs uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold ${color ?? 'text-steam-text'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-steam-muted">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/QuickStats.tsx
git commit -m "feat: add QuickStats component"
```

---

### Task 7: ChartSection + MAUChart

**Files:**
- Create: `web/src/components/ChartSection.tsx`
- Create: `web/src/components/MAUChart.tsx`

**Interfaces:**
- Consumes: `MAURecord`, data-layer functions
- Produces:
  - `<ChartSection records />` — guards for `< 2` records
  - `<MAUChart records />` — the full Recharts chart
- Props: both take `{ records: MAURecord[] }`

- [ ] **Step 1: Write src/components/ChartSection.tsx**

```typescript
import type { MAURecord } from '../types'
import MAUChart from './MAUChart'

interface Props {
  records: MAURecord[]
}

export default function ChartSection({ records }: Props) {
  if (records.length < 2) {
    return (
      <div className="mx-auto mt-6 max-w-7xl px-4">
        <div className="flex h-64 items-center justify-center rounded-sm bg-steam-card text-steam-muted shadow-steam ring-1 ring-steam-border/50">
          <div className="text-center">
            <p className="text-lg">Not enough data yet</p>
            <p className="mt-1 text-sm">
              Chart will appear once more data points are collected.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <MAUChart records={records} />
}
```

- [ ] **Step 2: Write src/components/MAUChart.tsx**

```typescript
import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Legend,
} from 'recharts'
import type { MAURecord } from '../types'
import { getVersionPeak, getPeak, getMinMAU, getAvgMAU } from '../data'

const EVENTS = {
  CSGO_RELEASE: { date: '2012-08-21', label: 'CS:GO', color: '#f5c542' },
  CSGO_F2P: { date: '2018-12-06', label: 'F2P', color: '#d97ed9' },
  CS2_ANNOUNCED: { date: '2023-03-22', label: 'CS2 Ann.', color: '#a4d007' },
  CS2_RELEASE: { date: '2023-09-27', label: 'CS2', color: '#a4d007' },
} as const

const CS2_CUTOFF = '2023-09-27'

function fmtFull(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function fmtShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMAU(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function movingAvg(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    const slice = data.slice(i - window + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b, 0) / window)
  })
}

interface ChartPoint extends MAURecord {
  dateLabel: string
  ma6?: number | null
  csgoMau?: number | null
  cs2Mau?: number | null
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    payload: ChartPoint
  }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  const record = payload[0].payload as ChartPoint
  return (
    <div className="rounded-sm border border-steam-border bg-steam-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-steam-blue">{fmtFull(record.date)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-steam-muted">{p.name}:</span>
          <span className="text-steam-text font-mono">
            {p.value.toLocaleString('en-US')}
          </span>
        </div>
      ))}
      <p className="mt-0.5 text-steam-muted">
        {record.game_version.toUpperCase()}
      </p>
    </div>
  )
}

interface Props {
  records: MAURecord[]
}

export default function MAUChart({ records }: Props) {
  const data: ChartPoint[] = useMemo(() => {
    const mauValues = records.map((r) => r.mau)
    const ma6 = movingAvg(mauValues, 6)
    return records.map((r, i) => ({
      ...r,
      dateLabel: fmtShort(r.date),
      ma6: ma6[i],
      csgoMau: r.game_version === 'csgo' ? r.mau : null,
      cs2Mau: r.game_version === 'cs2' ? r.mau : null,
    }))
  }, [records])

  const maxMAU = getPeak()?.mau ?? 0
  const minMAU = getMinMAU() ?? 0
  const avgMAU = getAvgMAU() ?? 0
  const csgoPeak = getVersionPeak('csgo')
  const cs2Peak = getVersionPeak('cs2')

  const firstDate = records[0].date
  const lastDate = records[records.length - 1].date
  const startYear = new Date(firstDate).getFullYear().toString()
  const endYear = new Date(lastDate).getFullYear().toString()

  const csgoRecords = records.filter((r) => r.game_version === 'csgo')

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="rounded-sm bg-steam-card px-4 py-5 shadow-steam ring-1 ring-steam-border/50 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-steam-muted">
            MAU History
          </p>
          <span className="text-xs text-steam-muted">
            {startYear} · {endYear} · {records.length} mo
          </span>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="mauGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#66c0f4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#66c0f4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="csgoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b8bc9" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4b8bc9" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cs2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a4d007" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#a4d007" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5a" />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#8f98a0', fontSize: 10 }}
              stroke="#2a3f5a"
              interval="preserveStartEnd"
            />

            <YAxis
              tickFormatter={formatMAU}
              tick={{ fill: '#8f98a0', fontSize: 11 }}
              stroke="#2a3f5a"
              domain={[0, 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Layer 1: Era backgrounds */}
            <ReferenceArea
              x1={fmtShort(csgoRecords[0]?.date ?? firstDate)}
              x2={fmtShort(CS2_CUTOFF)}
              fill="#4b8bc9"
              fillOpacity={0.03}
              label={{
                value: 'CS:GO',
                position: 'insideTopLeft',
                fill: '#4b8bc9',
                fontSize: 12,
              }}
            />
            <ReferenceArea
              x1={fmtShort(CS2_CUTOFF)}
              fill="#a4d007"
              fillOpacity={0.03}
              label={{
                value: 'CS2',
                position: 'insideTopRight',
                fill: '#a4d007',
                fontSize: 12,
              }}
            />

            {/* Layer 2: Event lines */}
            {Object.values(EVENTS).map((ev) => (
              <ReferenceLine
                key={ev.label}
                x={fmtShort(ev.date)}
                stroke={ev.color}
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: ev.label,
                  position: 'top',
                  fill: ev.color,
                  fontSize: 10,
                }}
              />
            ))}

            {/* Layer 3: Version area fills */}
            <Area
              type="monotone"
              dataKey="csgoMau"
              stroke="none"
              fill="url(#csgoGrad)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="cs2Mau"
              stroke="none"
              fill="url(#cs2Grad)"
              isAnimationActive={false}
            />

            {/* Layer 4: Total MAU area fill */}
            <Area
              type="monotone"
              dataKey="mau"
              stroke="none"
              fill="url(#mauGrad)"
              isAnimationActive={false}
            />

            {/* Layer 5: MAU main line */}
            <Line
              type="monotone"
              dataKey="mau"
              stroke="#66c0f4"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: '#66c0f4' }}
              isAnimationActive={false}
            />

            {/* Layer 6: Moving average */}
            <Line
              type="monotone"
              dataKey="ma6"
              stroke="#f5c542"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />

            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="line"
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  mau: 'MAU',
                  ma6: '6-Month Avg',
                  csgoMau: 'CS:GO',
                  cs2Mau: 'CS2',
                }
                return (
                  <span className="text-steam-muted">
                    {labels[value] ?? value}
                  </span>
                )
              }}
            />

            <Brush
              dataKey="dateLabel"
              height={28}
              stroke="#316282"
              fill="#16202d"
              tickFormatter={() => ''}
              startIndex={Math.max(0, records.length - 36)}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Bottom stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-steam-border/50 pt-4 sm:grid-cols-5">
          <Stat label="Peak" value={formatNumber(maxMAU)} />
          <Stat label="Lowest" value={formatNumber(minMAU)} />
          <Stat label="Average" value={formatNumber(avgMAU)} />
          <Stat label="CS:GO Peak" value={formatNumber(csgoPeak)} />
          <Stat label="CS2 Peak" value={formatNumber(cs2Peak)} />
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

- [ ] **Step 3: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ChartSection.tsx web/src/components/MAUChart.tsx
git commit -m "feat: add ChartSection and MAUChart components"
```

---

### Task 8: App (Root Component)

**Files:**
- Create: `web/src/App.tsx`

**Interfaces:**
- Consumes: All components, data-layer (`getLatest`, `getAll`, `getCount`, `getYoYGrowth`)
- Produces: `<App />` — the complete page

- [ ] **Step 1: Write src/App.tsx**

```typescript
import Header from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import QuickStats from './components/QuickStats'
import ChartSection from './components/ChartSection'
import { getLatest, getAll, getYoYGrowth, getCount } from './data'

export default function App() {
  const latest = getLatest()
  const records = getAll()

  // Empty data guard
  if (!latest || records.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-steam-bg">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-steam-muted">
            <p className="text-lg">No data available</p>
            <p className="mt-1 text-sm">
              Run{' '}
              <code className="rounded bg-steam-card px-1 py-0.5 text-xs">
                npm run predev
              </code>{' '}
              to sync data files.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const yoyGrowth = getYoYGrowth()
  const count = getCount()

  return (
    <div className="flex min-h-screen flex-col bg-steam-bg">
      <Header />
      <main className="flex-1 pb-8">
        <HeroSection latest={latest} yoyGrowth={yoyGrowth} count={count} />
        <QuickStats records={records} />
        <div className="mt-6">
          <ChartSection records={records} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat: add App root component"
```

---

### Task 9: Final Verification

**Files:**
- Modify: `web/src/data/` (copied by prebuild)

**Interfaces:**
- Consumes: All tasks completed

- [ ] **Step 1: Clean install and type check**

```bash
cd web && rm -rf node_modules && npm install && npx tsc --noEmit
```

Expected: Clean install, no type errors

- [ ] **Step 2: Build check**

```bash
cd web && npm run build
```

Expected: Successful build with no errors

- [ ] **Step 3: Verify dev server starts**

```bash
cd web && npm run dev
```

Expected: Vite dev server starts, confirms URL. Kill after verifying.

- [ ] **Step 4: Commit remaining files**

```bash
git add web/
git commit -m "feat: complete web rebuild"
```
