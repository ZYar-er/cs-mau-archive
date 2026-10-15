import type { ReactNode } from 'react'
import type { MAURecord } from '../types'
import { getPrevious } from '../lib/data'
import { fmtNum, fmtGameVersion } from '../lib/format'
import QuickStats from './QuickStats'
import AnimatedNumber from './AnimatedNumber'
import { useI18n } from '../lib/i18n'

interface Props {
  latest: MAURecord
  yoyGrowth: string | null
  momGrowth: string | null
  count: number
}

export default function HeroSection({
  latest,
  yoyGrowth,
  momGrowth,
  count,
}: Props) {
  const { t, locale } = useI18n()
  const endYear = Number(latest.date.slice(0, 4))
  const yoyPositive = yoyGrowth != null && Number(yoyGrowth) >= 0
  const momPositive = momGrowth != null && Number(momGrowth) >= 0
  const prev = getPrevious()
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
  const asOfDate = locale.startsWith('zh')
    ? `${latest.date.slice(0, 4)}年${Number(latest.date.slice(5, 7))}月`
    : new Date(latest.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })

  return (
    <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-2 lg:flex-row">
        {/* Hero MAU */}
        <div className="flex flex-1 flex-col justify-center overflow-hidden rounded-sm bg-steam-elevated px-5 py-4 shadow-steam-lg ring-1 ring-steam-border/50">
          <h1 className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-steam-muted sm:text-sm">
            {t('heroTitle')}
            {/* Bing/Google require an h1 with topic keywords; the visible
                label is short, so the exact figure rides along for crawlers
                and screen readers (visually hidden, not cloaking). */}
            <span className="sr-only">
              {locale.startsWith('zh')
                ? `：${fmtNum(latest.mau)} 名玩家（${asOfDate}）`
                : `: ${fmtNum(latest.mau)} players (${asOfDate})`}
            </span>
            <span className="rounded-sm bg-steam-control/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-steam-blue-bright ring-1 ring-steam-blue/30">
              {fmtGameVersion(latest.game_version)}
            </span>
          </h1>
            {/* `hero-mau` carries the prefixed half of the clip — see the rule
                in index.css for why the utilities alone are not enough. */}
            <p className="hero-mau bg-gradient-to-r from-steam-blue-bright via-steam-blue to-steam-blue-mid bg-clip-text text-3xl font-bold tracking-tight tabular-nums whitespace-nowrap text-transparent min-[360px]:text-4xl sm:text-5xl lg:text-6xl">
              <AnimatedNumber value={latest.mau} from={prev?.mau} />
            </p>
            <div className="mt-3 h-px bg-gradient-to-r from-steam-blue-bright/60 via-steam-blue/25 to-transparent" />
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-steam-muted sm:text-base">
              <span>{t('asOf').replace('{date}', asOfDate)}</span>
              {(momGrowth || yoyGrowth) && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {momGrowth && (
                    <GrowthBadge
                      label={t('mom')}
                      value={momGrowth}
                      positive={momPositive}
                    />
                  )}
                  {yoyGrowth && (
                    <GrowthBadge
                      label={t('yoy')}
                      value={yoyGrowth}
                      positive={yoyPositive}
                    />
                  )}
                </div>
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
            <QuickStats />
          </div>
        </div>
      </div>
    </div>
  )
}

function GrowthBadge({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium tabular-nums ring-1 sm:text-sm ${
        positive
          ? 'bg-steam-green/10 text-steam-green ring-steam-green/40'
          : 'bg-red-500/10 text-red-400 ring-red-500/40'
      }`}
    >
      <svg
        viewBox="0 0 10 10"
        aria-hidden
        className={`h-2 w-2 shrink-0 ${positive ? '' : 'rotate-180'}`}
      >
        <path d="M5 1 L9 8 H1 Z" fill="currentColor" />
      </svg>
      {label} {positive ? '+' : ''}
      {value}%
    </span>
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
