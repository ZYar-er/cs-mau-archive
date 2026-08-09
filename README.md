# CS MAU Tracker

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
- `scripts/fetch_archive.py` — convenience wrapper: downloads snapshots, then parses them into `data/history.json`.

## License

MIT — see [LICENSE](LICENSE).
