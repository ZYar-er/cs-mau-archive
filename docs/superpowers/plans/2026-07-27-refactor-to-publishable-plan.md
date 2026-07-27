# CS MAU Archive — Refactor to Publishable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor to a publishable state — light repo cleanup, redesign web visualization with visx (replacing Recharts), prepare Cloudflare Pages deployment, and switch the data fetch from daily to monthly cadence.

**Architecture:** Pure static SPA on Cloudflare Pages. `src/lib/data.ts` is the sole data layer. visx (low-level React SVG) replaces Recharts to escape Brush/ReferenceLine/null-data bugs. GH Actions runs a monthly fetcher that commits `data/*.json`, triggering a Pages rebuild.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, visx 4 (@visx/group, @visx/shape, @visx/scale, @visx/axis, @visx/tooltip, @visx/responsive, @visx/clip-path, @visx/brush, @visx/event, @visx/xychart), d3-scale 4, d3-shape 3, d3-time-format 4. Python 3.11 for the fetch script.

## Global Constraints

- All web files under `web/`
- `@import 'tailwindcss'` (Tailwind v4 syntax); Steam theme tokens via `@theme` with `steam-` prefix
- `verbatimModuleSyntax: true` → use `import type` for type-only imports
- `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`
- visx animations disabled where present; chart is data-static so animation is unnecessary
- No business logic in components — compute in `lib/` or pass via props
- Handle empty data at every level (data layer → App → chart)
- API publishes monthly on the 1st at 07:00 UTC; fetch cron is `0 9 1 * *`
- Python script uses type hints; `fetch_*.py` / `parse_*.py` naming convention
- Conventional commit prefixes: `feat:`, `fix:`, `docs:`, `data:`, `chore:`, `refactor:`
- `AGENTS.md` is third-party-generated and is NOT committed

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `README.md` | Create | Project intro + deploy instructions |
| `LICENSE` | Create | MIT license |
| `.editorconfig` | Create | Editor consistency |
| `.gitignore` | Modify | Fix root ignores |
| `scripts/fetch_monthly.py` | Rename+Modify | Monthly fetch + month dedup |
| `scripts/fetch_daily.py` | Delete | Replaced by fetch_monthly.py |
| `.github/workflows/daily_fetch.yml` | Delete | Replaced |
| `.github/workflows/monthly_fetch.yml` | Create | Monthly cron fetch |
| `.github/workflows/web-build.yml` | Create | PR build validation |
| `web/wrangler.toml` | Create | Cloudflare Pages config |
| `web/package.json` | Overwrite | visx deps, remove recharts |
| `web/vite.config.ts` | Overwrite | build output to dist |
| `web/tsconfig.json` | Overwrite | same strict settings |
| `web/.gitignore` | Keep | node_modules, dist, src/data/ |
| `web/index.html` | Overwrite | title + entry |
| `web/public/favicon.svg` | Keep | existing favicon |
| `web/scripts/copy-data.mjs` | Keep | copy root data → src/data |
| `web/src/index.css` | Overwrite | Tailwind + redesigned Steam theme |
| `web/src/main.tsx` | Overwrite | entry |
| `web/src/types.ts` | Keep | MAURecord (has wayback_timestamp) |
| `web/src/lib/data.ts` | Create | merge + compute exports |
| `web/src/lib/format.ts` | Create | centralized formatters |
| `web/src/lib/scale.ts` | Create | visx scale helpers |
| `web/src/hooks/useBrush.ts` | Create | brush selection state |
| `web/src/components/Header.tsx` | Overwrite | redesigned nav |
| `web/src/components/Footer.tsx` | Overwrite | redesigned footer |
| `web/src/components/HeroSection.tsx` | Overwrite | redesigned hero |
| `web/src/components/QuickStats.tsx` | Overwrite | redesigned stat row |
| `web/src/components/ChartSection.tsx` | Overwrite | chart + guard |
| `web/src/components/MAUChart.tsx` | Overwrite | visx main chart |
| `web/src/components/ChartBrush.tsx` | Create | custom brush |
| `web/src/components/ChartTooltip.tsx` | Create | custom tooltip |
| `web/src/components/ui/*` | Create | Steam UI atoms (Card, Stat) |
| `web/src/App.tsx` | Overwrite | root, empty-state guard |
| `web/src/data/index.ts` | Delete | replaced by lib/data.ts |
| `web/src/data/*.json` | Build-generated | copy-data output |

**Frontend-design skill:** Tasks that create/overwrite UI components invoke `superpowers:frontend-design` (or the `frontend-design` skill) during implementation to drive the visual redesign while keeping the Steam dark-theme spirit.

---

### Task 1: Light repo cleanup

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.editorconfig`
- Modify: `.gitignore`

**Interfaces:**
- Produces: a tidy repo root ready for remote/publish

- [ ] **Step 1: Write README.md**

```markdown
# CS MAU Archive

Historical monthly active users (MAU) for Counter-Strike (CS:GO → CS2), scraped from the official Steam API that powers [counter-strike.net](https://www.counter-strike.net/).

## Data

- `data/history.json` — monthly records from 2013-10 to present (Wayback Machine + Steam API)
- `data/daily.json` — latest monthly record from the Steam API
- `data/current.json` — single most-recent record

Steam API endpoint: `https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1` — publishes monthly on the 1st at 07:00 UTC.

## Web

The dashboard in `web/` is a React + Vite + Tailwind + visx static SPA.

```sh
cd web
npm run dev      # local dev (auto-syncs data)
npm run build    # production build → web/dist
npm run preview  # preview the build
```

## Deployment (Cloudflare Pages)

The site is pure static. `web/wrangler.toml` configures the Pages project; `npm run build` outputs to `web/dist`.

1. Push the repo to GitHub.
2. In Cloudflare, create a Pages project connected to the repo.
3. Build command: `npm run build` (run in `web/` directory). Output directory: `web/dist`.
4. Monthly data updates auto-commit via GitHub Actions and trigger a Pages rebuild.

## Data pipeline

- `scripts/fetch_monthly.py` — calls the Steam API monthly, dedups by month, appends to `data/daily.json`. Runs via `.github/workflows/monthly_fetch.yml` on the 1st at 09:00 UTC.
- `scripts/parse_archives.py` — parses Wayback Machine HTML snapshots into `data/history.json`.
- `scripts/download_archives.py` / `fetch_api_archive.py` — fetch the raw snapshots.

## License

MIT — see [LICENSE](LICENSE).
```

- [ ] **Step 2: Write LICENSE (MIT)**

```
MIT License

Copyright (c) 2026 ZYar-er

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Write .editorconfig**

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,tsx,js,mjs,json,css,md,yml,yaml}]
indent_style = space
indent_size = 2

[*.py]
indent_style = space
indent_size = 4
```

- [ ] **Step 4: Fix .gitignore**

```
__pycache__/
*.pyc
.env
archive/
node_modules/
dist/
*.local
.DS_Store
```

- [ ] **Step 5: Commit**

```bash
git add README.md LICENSE .editorconfig .gitignore
git commit -m "chore: add README, LICENSE, editorconfig; fix gitignore"
```

---

### Task 2: Rename fetch_daily → fetch_monthly with month dedup

**Files:**
- Rename: `scripts/fetch_daily.py` → `scripts/fetch_monthly.py`
- Modify: `scripts/fetch_monthly.py`
- Delete: `scripts/fetch_daily.py` (covered by rename)

**Interfaces:**
- Produces: `scripts/fetch_monthly.py` that writes month-deduped records with `date = YYYY-MM-01` from the API `time` field.

- [ ] **Step 1: Read current fetch_daily.py** to confirm starting point (lines: imports, `_game_version`, `fetch_mau`, `load_json`, `save_json`, `main`).

- [ ] **Step 2: Write scripts/fetch_monthly.py**

```python
"""
Monthly MAU fetcher for Counter-Strike.

Calls the official Steam API endpoint that powers the counter-strike.net
homepage player-count display and records the result. The API publishes
monthly on the 1st at 07:00 UTC.

Endpoint:
  https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import requests

API_URL = "https://api.steampowered.com/ICSGOServers_730/GetMonthlyPlayerCount/v1"
CS2_CUTOFF = datetime(2023, 9, 27, tzinfo=timezone.utc)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DAILY_FILE = DATA_DIR / "daily.json"
CURRENT_FILE = DATA_DIR / "current.json"

HEADERS = {
    "User-Agent": "cs-mau-archive/1.0 (+https://github.com/anomalyco/cs-mau-archive)",
    "Accept": "application/json",
}


def _game_version(dt: datetime) -> str:
    return "cs2"


def fetch_mau() -> dict | None:
    """Hit the Steam API and return the raw response JSON as a dict."""
    try:
        resp = requests.get(
            f"{API_URL}?format=json",
            timeout=30,
            headers=HEADERS,
        )
        resp.raise_for_status()
        return resp.json()
    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"API request failed: {e}")
        return None


def load_json(path: Path) -> list | dict | None:
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def save_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
    result = fetch_mau()
    if result is None:
        print("Failed to fetch MAU. Exiting.")
        return

    players = result.get("result", {}).get("players")
    api_time = result.get("result", {}).get("time")

    if players is None or api_time is None:
        print("MAU or time not found in API response.")
        return

    mau = int(players)
    # API time is ISO-8601 UTC, e.g. "2026-07-01T07:00:00Z"
    api_dt = datetime.fromisoformat(api_time.replace("Z", "+00:00"))
    month_first = api_dt.strftime("%Y-%m-01")
    version = _game_version(api_dt)

    print(f"[API time {api_time}] MAU={mau:,}  month={month_first}  game={version}")

    record = {
        "date": month_first,
        "mau": mau,
        "game_version": version,
        "source": "steam_api",
        "api_timestamp": api_time,
    }

    # Load daily.json and dedup by month (YYYY-MM)
    daily = load_json(DAILY_FILE)
    if daily is None:
        daily = []
    if not isinstance(daily, list):
        daily = [daily]

    month_key = month_first[:7]  # YYYY-MM
    updated = False
    for i, entry in enumerate(daily):
        if isinstance(entry, dict) and entry.get("date", "")[:7] == month_key:
            daily[i] = record
            updated = True
            break
    if not updated:
        daily.append(record)

    # Keep ascending by date
    daily.sort(key=lambda r: r.get("date", ""))
    save_json(DAILY_FILE, daily)

    # Overwrite current.json
    save_json(CURRENT_FILE, record)

    print(f"Saved. daily.json has {len(daily)} entries (updated={updated}).")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Verify script runs (network available)**

```bash
python scripts/fetch_monthly.py
```

Expected: prints `[API time ...] MAU=... month=YYYY-MM-01 ...`, `daily.json` has the record with `date` = month-first.

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch_monthly.py
git rm scripts/fetch_daily.py
git commit -m "refactor: rename fetch_daily to fetch_monthly with month dedup"
```

---

### Task 3: Workflows — monthly fetch + web build validation

**Files:**
- Delete: `.github/workflows/daily_fetch.yml`
- Create: `.github/workflows/monthly_fetch.yml`
- Create: `.github/workflows/web-build.yml`

**Interfaces:**
- Produces: monthly cron fetch + PR build validation

- [ ] **Step 1: Delete old workflow**

```bash
git rm .github/workflows/daily_fetch.yml
```

- [ ] **Step 2: Write .github/workflows/monthly_fetch.yml**

```yaml
name: Monthly CS MAU Fetch

on:
  schedule:
    - cron: "0 9 1 * *"  # 1st, 09:00 UTC (API publishes 07:00 UTC; 2h margin)
  workflow_dispatch:       # allow manual trigger

permissions:
  contents: write

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Fetch monthly MAU
        run: python scripts/fetch_monthly.py

      - name: Commit and push if changed
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "data: update MAU [skip ci]"
          file_pattern: "data/*.json"
          commit_user_name: "github-actions[bot]"
          commit_user_email: "github-actions[bot]@users.noreply.github.com"
```

- [ ] **Step 3: Write .github/workflows/web-build.yml**

```yaml
name: Web Build

on:
  pull_request:
    paths:
      - 'web/**'
      - 'data/**'
      - '.github/workflows/web-build.yml'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: "web/package-lock.json"

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Build
        run: npm run build
        working-directory: web
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/monthly_fetch.yml .github/workflows/web-build.yml
git commit -m "ci: monthly fetch workflow + web build validation"
```

---

### Task 4: web config — visx deps, wrangler, build output

**Files:**
- Overwrite: `web/package.json`
- Overwrite: `web/vite.config.ts`
- Overwrite: `web/tsconfig.json`
- Overwrite: `web/index.html`
- Create: `web/wrangler.toml`
- Delete: `web/src/data/index.ts` (replaced by lib/data.ts; keep src/data/*.json)

**Interfaces:**
- Produces: web project with visx installed, Cloudflare Pages config, build → `web/dist`

- [ ] **Step 1: Write web/package.json**

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
    "vite": "^8.1.1",
    "wrangler": "^4.0.0"
  },
  "dependencies": {
    "@visx/axis": "^4.0.0",
    "@visx/brush": "^4.0.0",
    "@visx/clip-path": "^4.0.0",
    "@visx/event": "^4.0.0",
    "@visx/group": "^4.0.0",
    "@visx/responsive": "^4.0.0",
    "@visx/scale": "^4.0.0",
    "@visx/shape": "^4.0.0",
    "@visx/tooltip": "^4.0.0",
    "@visx/xychart": "^4.0.0",
    "d3-scale": "^4.0.2",
    "d3-shape": "^3.2.0",
    "d3-time-format": "^4.1.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  }
}
```

- [ ] **Step 2: Write web/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 3: Write web/tsconfig.json**

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

- [ ] **Step 4: Write web/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Historical monthly active users for Counter-Strike (CS:GO → CS2)." />
    <title>CS MAU Archive</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write web/wrangler.toml**

```toml
name = "cs-mau-archive"
compatibility_date = "2026-07-01"
pages_build_output_dir = "dist"
```

- [ ] **Step 6: Remove old data index (replaced by lib/data.ts)**

```bash
git rm web/src/data/index.ts
```

(The `web/src/data/*.json` are gitignored build artifacts; copy-data still produces them.)

- [ ] **Step 7: Install dependencies**

```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

Expected: visx + d3 packages install; `recharts` is gone.

- [ ] **Step 8: Commit**

```bash
git add web/package.json web/vite.config.ts web/tsconfig.json web/index.html web/wrangler.toml
git commit -m "refactor(web): visx deps, wrangler config, build output"
```

---

### Task 5: Theme + types + entry + format/scale libs

**Files:**
- Overwrite: `web/src/index.css`
- Keep: `web/src/types.ts`
- Overwrite: `web/src/main.tsx`
- Create: `web/src/lib/format.ts`
- Create: `web/src/lib/scale.ts`
- Create: `web/src/lib/data.ts`

**Interfaces:**
- Consumes: `MAURecord` from `src/types.ts`, `daily.json`/`history.json` in `src/data/`
- Produces:
  - Steam theme (redesigned) in `index.css`
  - `fmtNum`, `fmtDate`, `fmtTimestamp`, `fmtMAU`, `fmtMonthShort`, `fmtYearMonth` from `lib/format.ts`
  - `makeTimeScale`, `makeLinearScale` from `lib/scale.ts`
  - data-layer exports: `getAll`, `getLatest`, `getYoYGrowth`, `getPeak`, `getMinMAU`, `getAvgMAU`, `getVersionPeak`, `getCount` from `lib/data.ts`

- [ ] **Step 1: Write src/index.css (redesigned Steam theme)**

```css
@import 'tailwindcss';

@theme {
  --color-steam-nav: #171a21;
  --color-steam-bg: #1b2838;
  --color-steam-card: #16202d;
  --color-steam-elevated: #1b3040;
  --color-steam-border: #2a3f5a;
  --color-steam-blue: #66c0f4;
  --color-steam-blue-bright: #a4d4f0;
  --color-steam-green: #a4d007;
  --color-steam-text: #c6d4df;
  --color-steam-muted: #8f98a0;
  --color-steam-control: #316282;
  --shadow-steam: 0 1px 3px rgb(0 0 0 / 0.3);
  --shadow-steam-lg: 0 4px 12px rgb(0 0 0 / 0.4);
  --font-sans: 'Motiva Sans', Arial, Helvetica, sans-serif;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--color-steam-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
::-webkit-scrollbar-thumb:hover {
  background: var(--color-steam-control);
}
```

- [ ] **Step 2: Confirm src/types.ts (unchanged)**

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

- [ ] **Step 4: Write src/lib/format.ts**

```typescript
export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function fmtTimestamp(iso: string): string {
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

// Compact MAU for axis labels: 32,387,073 → "32.39M"
export function fmtMAU(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// "2013/10" for axis ticks
export function fmtMonthShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "Oct 2013" for tooltip
export function fmtYearMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}
```

- [ ] **Step 5: Write src/lib/scale.ts**

```typescript
import { scaleTime, scaleLinear } from 'd3-scale'

export function makeTimeScale(domain: [Date, Date], range: [number, number]) {
  return scaleTime().domain(domain).range(range)
}

export function makeLinearScale(
  domain: [number, number],
  range: [number, number],
) {
  return scaleLinear().domain(domain).range(range)
}
```

- [ ] **Step 6: Write src/lib/data.ts**

```typescript
import type { MAURecord } from '../types'
import dailyJson from '../data/daily.json'
import historyJson from '../data/history.json'

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

- [ ] **Step 7: Copy data + verify TypeScript**

```bash
cd web
npm run predev
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add web/src/index.css web/src/main.tsx web/src/lib/format.ts web/src/lib/scale.ts web/src/lib/data.ts
git commit -m "feat(web): theme, format/scale libs, data layer"
```

---

### Task 6: UI atoms + brush hook

**Files:**
- Create: `web/src/components/ui/Card.tsx`
- Create: `web/src/components/ui/Stat.tsx`
- Create: `web/src/hooks/useBrush.ts`

**Interfaces:**
- Produces:
  - `<Card>` — Steam-themed surface card (children, className, optional ring)
  - `<Stat>` — label/value/sub stat block
  - `useBrush({ count, initialStart, initialEnd })` → `{ start, end, setStart, setEnd, clamp }` for brush selection

- [ ] **Step 1: Write src/components/ui/Card.tsx**

```typescript
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  ring?: boolean
}

export default function Card({ children, className = '', ring = true }: Props) {
  return (
    <div
      className={`rounded-sm bg-steam-card px-4 py-4 shadow-steam ${
        ring ? 'ring-1 ring-steam-border/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Write src/components/ui/Stat.tsx**

```typescript
interface Props {
  label: string
  value: string
  sub?: string
  color?: string
  align?: 'center' | 'left'
}

export default function Stat({
  label,
  value,
  sub,
  color,
  align = 'center',
}: Props) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <p className="text-xs uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-bold ${color ?? 'text-steam-text'}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-steam-muted">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Write src/hooks/useBrush.ts**

```typescript
import { useCallback, useState } from 'react'

interface Options {
  count: number
  initialStart?: number
  initialEnd?: number
  minSpan?: number
}

export function useBrush({
  count,
  initialStart = 0,
  initialEnd,
  minSpan = 2,
}: Options) {
  const [start, setStart] = useState(
    Math.max(0, Math.min(initialStart, count - 1)),
  )
  const [end, setEnd] = useState(
    Math.min(initialEnd ?? count - 1, count - 1),
  )

  const clamp = useCallback(
    (nextStart: number, nextEnd: number): [number, number] => {
      let s = Math.max(0, Math.min(nextStart, count - 1))
      let e = Math.max(0, Math.min(nextEnd, count - 1))
      if (e - s < minSpan) {
        // Preserve the moved boundary; stretch the other side
        if (nextStart !== start) {
          s = Math.max(0, e - minSpan)
        } else {
          e = Math.min(count - 1, s + minSpan)
        }
      }
      return [s, e]
    },
    [count, minSpan, start],
  )

  return { start, end, setStart, setEnd, clamp }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ui/Card.tsx web/src/components/ui/Stat.tsx web/src/hooks/useBrush.ts
git commit -m "feat(web): UI atoms and brush hook"
```

---

### Task 7: Header + Footer + HeroSection + QuickStats (redesigned)

**Files:**
- Overwrite: `web/src/components/Header.tsx`
- Overwrite: `web/src/components/Footer.tsx`
- Overwrite: `web/src/components/HeroSection.tsx`
- Overwrite: `web/src/components/QuickStats.tsx`

**Interfaces:**
- Consumes: Steam theme classes, `fmtNum`/`fmtDate`/`fmtTimestamp` from `lib/format`, `MAURecord`
- Produces:
  - `<Header />` static
  - `<Footer />` static
  - `<HeroSection latest yoyGrowth count />` (Props: `{ latest: MAURecord; yoyGrowth: string | null; count: number }`)
  - `<QuickStats records />` (Props: `{ records: MAURecord[] }`)

> **Visual redesign note:** Use the frontend-design skill for these components. Keep the Steam dark-theme spirit (`steam-nav`/`steam-bg`/`steam-card`/`steam-blue`/`steam-green`) but improve typographic hierarchy, spacing rhythm, and subtle elevation. Hero MAU number stays the focal point. Keep the existing layout shapes (header bar, hero + meta sidebar, stat row) unless the skill proposes a clearly better arrangement.

- [ ] **Step 1: Write Header.tsx** (redesigned — keep Steam nav bar, refine spacing/typography via frontend-design)

```typescript
export default function Header() {
  return (
    <header className="bg-steam-nav shadow-steam-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <svg viewBox="0 0 16 16" className="h-7 w-7" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" stroke="#66c0f4" strokeWidth="0.5" />
          <path d="M6 5l4.5 3L6 11V5z" fill="#66c0f4" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="text-base font-semibold uppercase tracking-[0.15em] text-steam-text">
            CS MAU Archive
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-steam-muted">
            Counter-Strike Monthly Active Users
          </span>
        </div>
        <div className="ml-auto hidden items-center gap-3 text-xs text-steam-muted sm:flex">
          <span className="rounded-sm bg-steam-card px-2 py-1 uppercase tracking-wider">
            Steam Web API
          </span>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write Footer.tsx**

```typescript
export default function Footer() {
  return (
    <footer className="mt-12 border-t border-steam-border/50 bg-steam-nav">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-steam-muted sm:flex-row sm:px-6">
        <span>
          Data via Steam Web API &amp; Wayback Machine · Updated monthly
        </span>
        <span>CS MAU Archive &copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Write HeroSection.tsx**

```typescript
import type { MAURecord } from '../types'
import { fmtNum, fmtDate, fmtTimestamp } from '../lib/format'

interface Props {
  latest: MAURecord
  yoyGrowth: string | null
  count: number
}

export default function HeroSection({ latest, yoyGrowth, count }: Props) {
  const endYear = new Date(latest.date).getFullYear()
  const yoyPositive = yoyGrowth != null && Number(yoyGrowth) >= 0

  return (
    <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Hero MAU */}
        <div className="flex-1 overflow-hidden rounded-sm bg-gradient-to-b from-steam-elevated to-steam-bg px-6 py-6 shadow-steam-lg ring-1 ring-steam-border/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-steam-muted">
            Monthly Active Users
          </p>
          <p className="text-5xl font-bold tracking-tight text-steam-blue sm:text-6xl">
            {fmtNum(latest.mau)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-steam-muted">
            <span>as of {fmtDate(latest.date)}</span>
            {yoyGrowth && (
              <span
                className={
                  yoyPositive ? 'text-steam-green' : 'text-red-400'
                }
              >
                {yoyPositive ? '+' : ''}
                {yoyGrowth}% YoY
              </span>
            )}
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="flex flex-col gap-3 sm:flex-row lg:w-80 lg:flex-col">
          <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
            <p className="text-xs uppercase tracking-wider text-steam-muted">Game</p>
            <p className="mt-1 text-2xl font-bold uppercase tracking-wide text-steam-text">
              {latest.game_version}
            </p>
            <p className="mt-1 text-xs text-steam-muted">
              source: {latest.source}
            </p>
          </div>
          <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
            <p className="text-xs uppercase tracking-wider text-steam-muted">Archive</p>
            <p className="mt-1 text-2xl font-bold text-steam-text">{count}</p>
            <p className="mt-1 text-xs text-steam-muted">
              records · 2013–{endYear}
            </p>
          </div>
          {latest.api_timestamp && (
            <div className="flex-1 rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50">
              <p className="text-xs uppercase tracking-wider text-steam-muted">API Updated</p>
              <p className="mt-1 text-sm font-medium text-steam-text">
                {fmtTimestamp(latest.api_timestamp)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write QuickStats.tsx**

```typescript
import type { MAURecord } from '../types'
import { getPeak, getAvgMAU, getVersionPeak, getYoYGrowth } from '../lib/data'
import { fmtNum } from '../lib/format'

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
  const yoyPositive = yoy != null && Number(yoy) >= 0

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card label="Peak" value={fmtNum(peak)} sub={peakYear} />
        <Card label="Average" value={fmtNum(avg)} />
        <Card label="Latest" value={fmtNum(latest)} />
        <Card
          label="CS2 Peak"
          value={fmtNum(cs2Peak)}
          color="text-steam-green"
        />
        {yoy && (
          <Card
            label="YoY"
            value={`${yoyPositive ? '+' : ''}${yoy}%`}
            color={yoyPositive ? 'text-steam-green' : 'text-red-400'}
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
    <div className="rounded-sm bg-steam-card px-3 py-3 text-center shadow-steam ring-1 ring-steam-border/50">
      <p className="text-xs uppercase tracking-wider text-steam-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color ?? 'text-steam-text'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-steam-muted">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/Header.tsx web/src/components/Footer.tsx web/src/components/HeroSection.tsx web/src/components/QuickStats.tsx
git commit -m "feat(web): redesigned Header, Footer, HeroSection, QuickStats"
```

---

### Task 8: ChartBrush + ChartTooltip

**Files:**
- Create: `web/src/components/ChartBrush.tsx`
- Create: `web/src/components/ChartTooltip.tsx`

**Interfaces:**
- Consumes:
  - `useBrush` hook
  - `MAURecord`, `fmtYearMonth`, `fmtNum`
- Produces:
  - `<ChartBrush>` — a bottom strip with a draggable selection window over the full date range; calls back on selection change
  - `<ChartTooltip>` — absolute-positioned Steam-styled tooltip content for the hovered point

- [ ] **Step 1: Write src/components/ChartBrush.tsx**

Custom brush: a `<svg>` with the full record range mapped to the strip width, a draggable selection `<rect>` with two handles. Reports `[startIdx, endIdx]` via `onChange`. Min-span enforced via `useBrush.clamp`. No library brush used (avoids Recharts-class bugs; visx/brush is available but a custom one is simpler and fully controlled).

```typescript
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
```

- [ ] **Step 2: Write src/components/ChartTooltip.tsx**

```typescript
import type { MAURecord } from '../types'
import { fmtYearMonth, fmtNum } from '../lib/format'

interface Props {
  record: MAURecord
  ma6: number | null
  x: number
  y: number
  width: number
}

export default function ChartTooltip({ record, ma6, x, y, width }: Props) {
  // Flip tooltip to left side if it would overflow the right edge
  const left = x > width - 160 ? x - 150 : x + 12
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-sm border border-steam-border bg-steam-card px-3 py-2 text-xs shadow-steam-lg"
      style={{ left, top: Math.max(8, y - 60) }}
    >
      <p className="mb-1 text-steam-blue">{fmtYearMonth(record.date)}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-steam-blue" />
        <span className="text-steam-muted">MAU:</span>
        <span className="font-mono text-steam-text">{fmtNum(record.mau)}</span>
      </div>
      {ma6 != null && (
        <div className="mt-0.5 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f5c542]" />
          <span className="text-steam-muted">6mo avg:</span>
          <span className="font-mono text-steam-text">{fmtNum(ma6)}</span>
        </div>
      )}
      <p className="mt-0.5 text-steam-muted">{record.game_version.toUpperCase()}</p>
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
git add web/src/components/ChartBrush.tsx web/src/components/ChartTooltip.tsx
git commit -m "feat(web): custom ChartBrush and ChartTooltip"
```

---

### Task 9: MAUChart (visx) + ChartSection

**Files:**
- Overwrite: `web/src/components/MAUChart.tsx`
- Overwrite: `web/src/components/ChartSection.tsx`

**Interfaces:**
- Consumes:
  - `MAURecord`, `useBrush`, `ChartBrush`, `ChartTooltip`
  - `getAll`/`getPeak`/`getMinMAU`/`getAvgMAU`/`getVersionPeak` from `lib/data`
  - `fmtNum`, `fmtMAU`, `fmtMonthShort` from `lib/format`
  - visx `@visx/responsive` `ParentSizeModern`, `@visx/group` `Group`, `@visx/shape` `AreaClosed`/`LinePath`, `@visx/axis` `AxisBottom`/`AxisLeft`, `@visx/clip-path` `ClipPath`, d3 `scaleTime`/`scaleLinear`/`curveMonotoneX`
- Produces:
  - `<MAUChart records />` (Props: `{ records: MAURecord[] }`)
  - `<ChartSection records />` (Props: `{ records: MAURecord[] }`), `< 2` guard

- [ ] **Step 1: Write src/components/MAUChart.tsx**

The chart: `ParentSizeModern` measures container → inner `ChartInner` with fixed width/height. Build `xScale` (scaleTime over visible range) and `yScale` (scaleLinear `[0, maxMAU*1.1] → [height, 0]`). Draw: grid lines, MAU area (`AreaClosed` + gradient), MAU line (`LinePath`), 6-month moving average line (`LinePath`, dashed via strokeDasharray), event lines as raw `<line>` (positioned via `xScale(eventDate)` — always visible, no library brush-hiding), axes, hover crosshair + tooltip, bottom `ChartBrush`.

```typescript
import { useMemo, useState } from 'react'
import { ParentSizeModern } from '@visx/responsive'
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
          <ParentSizeModern>
            {({ width, height }) =>
              width > 0 && height > 0 ? (
                <ChartInner records={records} width={width} height={height} />
              ) : null
            }
          </ParentSizeModern>
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
            tickFormat={fmtMAU}
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
```

- [ ] **Step 2: Write src/components/ChartSection.tsx**

```typescript
import type { MAURecord } from '../types'
import MAUChart from './MAUChart'

interface Props {
  records: MAURecord[]
}

export default function ChartSection({ records }: Props) {
  if (records.length < 2) {
    return (
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
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

- [ ] **Step 3: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

Fix any type errors inline (visx generics can be strict; common fixes: explicit `<ChartPoint>` generics on `LinePath`/`AreaClosed`, `clipPath` attr casing). If `ParentSizeModern` isn't exported under that name, use the named export from `@visx/responsive` that renders children-as-function with `{width,height}` (check `node_modules/@visx/responsive` types).

- [ ] **Step 4: Build**

```bash
cd web && npm run build
```

Expected: successful build.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/MAUChart.tsx web/src/components/ChartSection.tsx
git commit -m "feat(web): visx MAUChart with custom brush and tooltip"
```

---

### Task 10: App root + final wiring

**Files:**
- Overwrite: `web/src/App.tsx`

**Interfaces:**
- Consumes: all components + data-layer
- Produces: `<App />` with empty-state guard

- [ ] **Step 1: Write src/App.tsx**

```typescript
import Header from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import QuickStats from './components/QuickStats'
import ChartSection from './components/ChartSection'
import { getLatest, getAll, getYoYGrowth, getCount } from './lib/data'

export default function App() {
  const latest = getLatest()
  const records = getAll()

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

- [ ] **Step 2: Verify TypeScript + build**

```bash
cd web && npx tsc --noEmit && npm run build
```

Expected: no errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat(web): App root with empty-state guard"
```

---

### Task 11: Final verification + launch

**Files:**
- none (verification only)

**Interfaces:**
- Consumes: all tasks complete

- [ ] **Step 1: Clean rebuild**

```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

Expected: clean install + successful build.

- [ ] **Step 2: Type check**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Launch dev server and smoke test**

```bash
cd web && npm run dev
```

Expected: Vite dev server starts at http://localhost:5173/. Open it, confirm:
- Header + Footer render
- Hero shows the latest MAU number, date, YoY
- QuickStats row shows 5 cards
- Chart renders: MAU area+line, moving average, 4 event lines, axes, hover tooltip
- Brush at bottom: drag handles → chart updates smoothly; event lines stay visible during drag (this is the visx fix vs Recharts)
- Empty-data path: temporarily empty `src/data/history.json` → reload → "No data" placeholder

Kill the dev server after verifying.

- [ ] **Step 4: Commit any remaining files**

```bash
git add -A
git status
# verify no node_modules / dist / archive staged
git commit -m "chore: final rebuild verification"
```

- [ ] **Step 5: Final git log check**

```bash
git log --oneline -15
```

Expected: all refactor commits present, working tree clean (except gitignored `web/dist`, `web/node_modules`, `web/src/data/*.json`).
