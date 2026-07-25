# CS MAU Archive — Web Visualization Rebuild

**Date**: 2026-07-25  
**Status**: approved

## Overview

Rebuild the web visualization from scratch. Keep the same tech stack (React + Vite + Tailwind CSS + Recharts), same visual style (Steam dark theme), and same layout structure. Fix all data-layer issues and remove code duplication.

## Tech Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 (Steam theme via `@theme` block)
- Recharts 3 for charting
- Data: JSON imports via Vite (static), merged in data layer

## Architecture

```
App
├── Header                    # Steam-style top nav bar
├── HeroSection               # Current MAU big number + 3 meta cards
├── QuickStats                # 5 horizontal mini stat cards
├── ChartSection              # Chart container with empty-state handling
│   └── MAUChart              # Single chart with all info layers
└── Footer                    # Data source attribution + copyright
```

## Data Flow

```
data/daily.json ──┐
                  ├──► data/index.ts ──► App ──► props ──► children
data/history.json ─┘    (merge + compute)
```

`data/index.ts` is the single data entry point. It merges daily and history JSON, deduplicates by date (daily wins), and exports:

| Export | Type | Description |
|---|---|---|
| `getAll()` | `MAURecord[]` | All records sorted by date |
| `getLatest()` | `MAURecord \| null` | Most recent record |
| `getYoYGrowth()` | `string \| null` | Year-over-year growth % |
| `getPeak()` | `MAURecord \| null` | Record with highest MAU |
| `getMinMAU()` | `number \| null` | Lowest MAU value |
| `getAvgMAU()` | `number \| null` | Mean MAU value |
| `getVersionPeak(v)` | `number` | Peak MAU for a given game_version |
| `getCount()` | `number` | Total record count |

Components only receive props or call data-layer functions — no business logic in components.

## Component Tree

### Header
- Static. No props.
- Steam dark nav (`#171a21`): logo SVG (play button icon) + "CS2 MAU Tracker" title + "Steam Web API" tag on the right.

### HeroSection
- Props: `{ latest: MAURecord; yoyGrowth: string \| null; count: number }`
- Layout: `flex-col lg:flex-row`
- Left: Big MAU number in `#66c0f4`, date, YoY badge (green/red)
- Right: 3 stacked info cards — Game version, Record count (with year range), API timestamp
- Empty-state guard handled by App (not rendered when no data)

### QuickStats
- Props: `{ records: MAURecord[] }`
- Calls data-layer functions internally or receives computed values from App
- 5 cards in responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Cards: Peak, Average, Latest, CS2 Peak, YoY (conditional)

### ChartSection
- Props: `{ records: MAURecord[] }`
- Guards: `records.length < 2` → renders "Not enough data" placeholder card
- Otherwise renders `MAUChart`

### MAUChart
- Props: `{ records: MAURecord[] }`
- Single `AreaChart` with layer order (bottom to top):
  1. `ReferenceArea` x2 — CS:GO era (blue tint), CS2 era (green tint)
  2. `CartesianGrid` — dark grid lines
  3. `Area` x2 — CS:GO area fill, CS2 area fill (version-separated color)
  4. `Area` x1 — Total MAU gradient fill
  5. `ReferenceLine` x4 — Events: CS:GO Release, F2P, CS2 Announced, CS2 Release
  6. `Line` x1 — MAU main line (`#66c0f4`)
  7. `Line` x1 — 6-month moving average (gold dashed)
  8. `Brush` — Default to last 36 months
  9. `Legend` — Clickable toggle
  10. `Tooltip` — Custom styled: date, per-series values, game version
- All animations disabled (`isAnimationActive={false}`)
- 6-month moving average computed via useMemo

### Footer
- Static: "Data via Steam Web API & Wayback Machine" + copyright year

## Error Handling

| Level | Scenario | Behavior |
|---|---|---|
| Data layer | JSON missing or invalid | Returns empty arrays / null |
| App | `getLatest()` returns null | Full-screen "No data" placeholder with `npm run predev` hint |
| ChartSection | `< 2` records | "Not enough data" card |
| copy-data.mjs | history.json missing or not array | Writes `[]` |

## Responsive Strategy

- HeroSection: stacked on mobile, side-by-side at `lg:`
- QuickStats: 2 → 3 → 5 columns
- Chart height: 300px mobile, 420px desktop
- Font sizes scale via Tailwind breakpoints (`sm:text-6xl`, etc.)

## Files (complete list)

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .gitignore
├── public/
│   └── favicon.svg
├── scripts/
│   └── copy-data.mjs
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types.ts
    ├── index.css
    ├── data/
    │   └── index.ts
    └── components/
        ├── Header.tsx
        ├── Footer.tsx
        ├── HeroSection.tsx
        ├── QuickStats.tsx
        ├── ChartSection.tsx
        └── MAUChart.tsx
```

## Steam Theme Colors (Tailwind @theme)

```css
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
```
