import type { MAURecord } from '../types'
import { fmtNum, fmtDate } from '../lib/format'
import QuickStats from './QuickStats'

interface Props {
  latest: MAURecord
  yoyGrowth: string | null
  momGrowth: string | null
  count: number
  records: MAURecord[]
}

export default function HeroSection({
  latest,
  yoyGrowth,
  momGrowth,
  count,
  records,
}: Props) {
  const endYear = new Date(latest.date).getFullYear()
  const yoyPositive = yoyGrowth != null && Number(yoyGrowth) >= 0
  const momPositive = momGrowth != null && Number(momGrowth) >= 0
  const apiTimestamp = latest.api_timestamp
  const apiDate = apiTimestamp
    ? new Date(apiTimestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : ''
  const apiTime = apiTimestamp
    ? new Date(apiTimestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short',
      })
    : ''

  return (
    <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-2 lg:flex-row">
        {/* Hero MAU */}
        <div className="flex flex-1 flex-col justify-center overflow-hidden rounded-sm bg-gradient-to-b from-steam-elevated to-steam-bg px-5 py-4 shadow-steam-lg ring-1 ring-steam-border/50">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-steam-muted">
            Monthly Active Users
          </p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-steam-blue min-[360px]:text-4xl sm:text-5xl">
            {fmtNum(latest.mau)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-steam-muted">
            <span>as of {fmtDate(latest.date)}</span>
            {momGrowth && (
              <span
                className={
                  momPositive ? 'text-steam-green' : 'text-red-400'
                }
              >
                {momPositive ? '+' : ''}
                {momGrowth}% MoM
              </span>
            )}
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
        <div className="flex min-w-0 flex-col gap-2 lg:w-96">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetaCard
              label="Game"
              value={latest.game_version}
              sub={`source: ${latest.source}`}
            />
            <MetaCard
              label="Archive"
              value={String(count)}
              sub={`records · 2013–${endYear}`}
            />
            {apiTimestamp && (
              <MetaCard
                label="API Updated"
                value={apiDate}
                sub={apiTime}
                small
              />
            )}
          </div>
          <div className="border-t border-steam-border/50 pt-2">
            <QuickStats records={records} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaCard({
  label,
  value,
  sub,
  small,
}: {
  label: string
  value: string
  sub?: string
  small?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center rounded-sm bg-steam-card px-3 py-2 shadow-steam ring-1 ring-steam-border/50">
      <p className="text-[10px] uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate tabular-nums ${
          small
            ? 'text-xs font-medium text-steam-text'
            : 'text-sm font-bold uppercase tracking-wide text-steam-text'
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[10px] text-steam-muted">{sub}</p>
      )}
    </div>
  )
}
