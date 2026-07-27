# CS MAU Archive — Refactor to Publishable State

**Date**: 2026-07-27
**Status**: approved

## Overview

Refactor the project to a publishable state: light repo cleanup, redesign the web visualization with visx (replacing Recharts), and prepare for Cloudflare Pages (static) deployment. The Steam monthly-player-count API publishes on the 1st at 07:00 UTC, so the data fetch is monthly, not daily.

## Key Constraints & Facts

- **API**: `https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1` powers the player count on counter-strike.net.
- **API cadence**: publishes monthly on the 1st at 07:00 UTC (`"time": "2026-07-01T07:00:00Z"`). Runs on other days get nothing new.
- **Deployment**: Cloudflare Pages, pure static SPA. No runtime server.
- **Data update**: GH Actions runs the (renamed) fetcher monthly → commits `data/*.json` → push triggers Pages rebuild. New data visible after rebuild.
- **Visualization tool**: visx (low-level React SVG) replaces Recharts to escape its Brush/ReferenceLine/null-data interaction bugs.
- **Design ambition**: redesign visuals (frontend-design skill) while keeping the Steam dark-theme spirit.

## Deployment Model

```
data/*.json ──(build-time inject)──► web build ──► dist/ ──► Cloudflare Pages
     ▲
GH Actions monthly fetch_monthly.py → commit data/*.json
     └─► push triggers Pages rebuild
```

- `web/wrangler.toml` configures the Pages project; `npm run build` outputs to `web/dist`.
- New CI workflow `web-build.yml` validates `npm run build` on PRs.
- `daily_fetch.yml` renamed → `monthly_fetch.yml`, cron `0 9 1 * *`.

## Repo Layout (after light cleanup)

```
cs-mau-archive/
├── README.md            # new: project intro + deploy instructions
├── LICENSE              # new (MIT)
├── .editorconfig        # new
├── .gitignore           # fixed
├── requirements.txt
├── data/                # unchanged
├── scripts/
│   ├── fetch_monthly.py # renamed from fetch_daily.py + month dedup
│   ├── parse_archives.py
│   ├── download_archives.py
│   └── fetch_api_archive.py
├── archive/             # gitignored
├── .github/workflows/
│   ├── monthly_fetch.yml  # renamed
│   └── web-build.yml       # new
└── web/
    ├── wrangler.toml    # new: Pages config
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── public/
    ├── scripts/copy-data.mjs
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types.ts
        ├── lib/
        │   ├── data.ts      # merge + compute (sole data entry)
        │   ├── format.ts    # centralized number/date formatting
        │   └── scale.ts     # visx scale helpers
        ├── hooks/
        │   └── useBrush.ts  # brush selection state
        └── components/
            ├── Header.tsx
            ├── Footer.tsx
            ├── HeroSection.tsx
            ├── QuickStats.tsx
            ├── ChartSection.tsx
            ├── MAUChart.tsx     # visx main chart
            ├── ChartBrush.tsx   # custom brush (no Recharts hiding bug)
            ├── ChartTooltip.tsx # custom tooltip
            └── ui/              # Steam UI atoms
```

NOTE: `AGENTS.md` exists in the working tree but is third-party-generated; per cleanup policy it is not committed.

## Data Layer (`src/lib/data.ts`)

Sole data entry point. Merges `daily.json` + `history.json`, dedups by date (daily wins), sorts ascending.

| Export | Type | Description |
|---|---|---|
| `getAll()` | `MAURecord[]` | all records sorted by date |
| `getLatest()` | `MAURecord \| null` | most recent record |
| `getYoYGrowth()` | `string \| null` | year-over-year % |
| `getPeak()` | `MAURecord \| null` | record with highest MAU |
| `getMinMAU()` | `number \| null` | lowest MAU |
| `getAvgMAU()` | `number \| null` | mean MAU |
| `getVersionPeak(v)` | `number` | peak for a game_version |
| `getCount()` | `number` | total records |

Components receive props or call data-layer functions only — no business logic in components.

## Component Tree

```
App
├── Header
├── HeroSection          # big MAU number + meta cards (date/YoY/version/count/api time)
├── QuickStats           # mini stat row: Peak/Avg/Latest/CS2 Peak/YoY
├── ChartSection         # < 2 records guard
│   └── MAUChart         # visx main chart
│       ├── ChartBrush   # custom brush (drag-hides fix)
│       └── ChartTooltip # custom tooltip
└── Footer
```

`lib/scale.ts` configures visx `scaleTime`; `hooks/useBrush.ts` manages brush selection; `lib/format.ts` centralizes formatting currently scattered across 3 files.

visx main chart uses `XYChart` + `AreaClosed` + `LinePath` for MAU; event lines drawn as raw SVG `<line>` (no library limitation); brush as custom draggable `<rect>` selection; tooltip via visx `Tooltip` + local content.

## Error Handling

| Layer | Scenario | Behavior |
|---|---|---|
| `copy-data.mjs` | `history.json` missing/non-array | write `[]` |
| `lib/data.ts` | empty/invalid JSON | `getAll()` → `[]`, `getLatest()` → `null`, others → `null`/`0` |
| `App.tsx` | `latest === null` | full-screen "No data" placeholder (hint: `copy-data`) |
| `ChartSection` | `records.length < 2` | "Not enough data" card |
| `MAUChart` (visx) | empty brush selection | clamp to min selection width, can't drag to 0 |
| build | `data/` missing | `copy-data` makes `[]`, build passes, shows empty state |

## Responsive Strategy

- Hero: `flex-col lg:flex-row`
- QuickStats: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Chart height: 300px mobile, 420px desktop
- visx wrapped in `ParentSizeModern` (`@visx/responsive`) to track container width/height

## Monthly Workflow (`.github/workflows/monthly_fetch.yml`)

```yaml
name: Monthly CS MAU Fetch
on:
  schedule:
    - cron: "0 9 1 * *"   # 1st, 09:00 UTC (API publishes 07:00 UTC; 2h margin)
  workflow_dispatch:
permissions:
  contents: write
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt
      - run: python scripts/fetch_monthly.py
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "data: update MAU [skip ci]"
          file_pattern: "data/*.json"
```

## PR Build Validation Workflow (`.github/workflows/web-build.yml`)

```yaml
name: Web Build
on:
  pull_request:
    paths: ['web/**', 'data/**']
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm", cache-dependency-path: "web/package-lock.json" }
      - run: npm ci
        working-directory: web
      - run: npm run build
        working-directory: web
```

## Script Change: `fetch_monthly.py`

Renamed from `fetch_daily.py`. Changes:
1. **Month dedup**: if `daily.json` already has a record for the same month (YYYY-MM), update it in place rather than appending. Manual re-triggers don't create duplicates.
2. **Date = API month-first**: record `date` = `YYYY-MM-01` derived from the API's `time` field, not the fetch day. Aligns with `history.json`'s monthly date convention and prevents the current `2026-07-24`-vs-data-date inconsistency.

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

Visual redesign (via frontend-design skill during implementation) keeps the Steam dark-theme spirit but improves typography, hierarchy, and micro-interactions.