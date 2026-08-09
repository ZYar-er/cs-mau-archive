import type { ReactNode } from 'react'
import type { MAURecord } from '../types'
import { fmtNum, fmtDate } from '../lib/format'
import QuickStats from './QuickStats'
import { useI18n } from '../lib/i18n'

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
  const { t, locale } = useI18n()
  const endYear = new Date(latest.date).getFullYear()
  const yoyPositive = yoyGrowth != null && Number(yoyGrowth) >= 0
  const momPositive = momGrowth != null && Number(momGrowth) >= 0
  const apiTimestamp = latest.api_timestamp
  const apiDate = apiTimestamp
    ? locale.startsWith('zh')
      ? apiTimestamp.slice(0, 10)
      : new Date(apiTimestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })
    : ''
  const apiTime = apiTimestamp
    ? new Date(apiTimestamp).toLocaleTimeString(locale, {
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
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-steam-muted sm:text-sm">
            {t('heroTitle')}
          </p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-steam-blue min-[360px]:text-4xl sm:text-5xl lg:text-6xl">
            {fmtNum(latest.mau)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-steam-muted sm:text-base">
            <span>{t('asOf').replace('{date}', fmtDate(latest.date, locale))}</span>
            {momGrowth && (
              <span
                className={
                  momPositive ? 'text-steam-green' : 'text-red-400'
                }
              >
                {momPositive ? '+' : ''}
                {momGrowth}% {t('mom')}
              </span>
            )}
            {yoyGrowth && (
              <span
                className={
                  yoyPositive ? 'text-steam-green' : 'text-red-400'
                }
              >
                {yoyPositive ? '+' : ''}
                {yoyGrowth}% {t('yoy')}
              </span>
            )}
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="flex min-w-0 flex-col gap-2 lg:w-[28rem]">
          <div className="grid grid-cols-3 gap-2">
            <MetaCard
              label={t('game')}
              value={latest.game_version}
              sub={
                <>
                  <span className="sm:hidden">{latest.source}</span>
                  <span className="hidden sm:inline">
                    {t('sourcePrefix').replace('{source}', latest.source)}
                  </span>
                </>
              }
            />
            <MetaCard
              label={t('archive')}
              value={String(count)}
              sub={
                <>
                  <span className="sm:hidden">2013–{endYear}</span>
                  <span className="hidden sm:inline">
                    {t('recordsSub').replace('{range}', `2013–${endYear}`)}
                  </span>
                </>
              }
            />
            {apiTimestamp && (
              <MetaCard
                label={t('apiUpdated')}
                value={apiDate}
                sub={apiTime}
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
}: {
  label: string
  value: string
  sub?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col justify-start rounded-sm bg-steam-card px-2 py-2 shadow-steam ring-1 ring-steam-border/50 sm:min-h-[76px] sm:px-3">
      <p className="text-[10px] uppercase tracking-wider text-steam-muted sm:text-xs">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wide tabular-nums text-steam-text sm:text-base"
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] leading-tight text-steam-muted sm:text-xs">
          {sub}
        </p>
      )}
    </div>
  )
}
