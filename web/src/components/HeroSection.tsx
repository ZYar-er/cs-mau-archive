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
