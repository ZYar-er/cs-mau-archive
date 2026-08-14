import type { MAURecord } from '../types'
import { getCount, getLatest, getPeak, getVersionPeakRecord } from '../lib/data'
import { fmtNum } from '../lib/format'
import { useI18n } from '../lib/i18n'

// Historical fixed event dates — keep in sync with MAUChart EVENTS (AGENTS.md
// 统计口径: fixed values allowed as constants, never used for dynamic stats).
const MILESTONES = [
  { date: '2012-08-21', labelKey: 'tCsgoLaunch' },
  { date: '2018-12-06', labelKey: 'tF2p' },
  { date: '2023-03-22', labelKey: 'tCs2Ann' },
  { date: '2023-09-27', labelKey: 'tCs2Launch' },
] as const

function monthLabel(date: string, zh: boolean): string {
  if (zh) return date.slice(0, 7)
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function InfoSection({ records }: { records: MAURecord[] }) {
  const { t, locale } = useI18n()
  const zh = locale.startsWith('zh')
  const latest = getLatest()
  const peak = getPeak()
  const csgoPeak = getVersionPeakRecord('csgo')
  const count = getCount()
  const first = records[0]?.date.slice(0, 7) ?? ''
  const last = records[records.length - 1]?.date.slice(0, 7) ?? ''
  const range = first && last ? `${first} → ${last}` : ''

  const fill = (s: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
      s,
    )

  const latestMonth = latest ? monthLabel(latest.date, zh) : ''
  const peakMonth = peak ? monthLabel(peak.date, zh) : ''
  const csgoPeakMonth = csgoPeak ? monthLabel(csgoPeak.date, zh) : ''

  return (
    <section id="about" className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-5 py-4 shadow-steam ring-1 ring-steam-border/50 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-steam-text sm:text-base">
          {t('aboutTitle')}
        </h2>

        <h3 className="mt-4 text-sm font-semibold text-steam-blue-bright">
          {t('methodTitle')}
        </h3>
        <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-steam-muted [overflow-wrap:anywhere]">
          <p>{t('methodP1')}</p>
          <p>{t('methodP2')}</p>
          <p>{fill(t('methodP3'), { count, range })}</p>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-steam-blue-bright">
          {t('timelineTitle')}
        </h3>
        <ol className="mt-1.5 space-y-1.5 text-sm text-steam-muted">
          {MILESTONES.map((m) => (
            <li key={m.date} className="flex flex-wrap gap-x-2 tabular-nums">
              <span className="text-steam-blue/80">
                {zh ? m.date.slice(0, 7) : monthLabel(m.date, false)}
              </span>
              <span>{t(m.labelKey)}</span>
            </li>
          ))}
          {csgoPeak && (
            <li className="flex flex-wrap gap-x-2 tabular-nums">
              <span className="text-steam-blue/80">{csgoPeakMonth}</span>
              <span>
                {fill(t('tCsgoPeak'), {
                  mau: fmtNum(csgoPeak.mau),
                  month: csgoPeakMonth,
                })}
              </span>
            </li>
          )}
          {peak && (
            <li className="flex flex-wrap gap-x-2 tabular-nums">
              <span className="text-steam-blue/80">{peakMonth}</span>
              <span>
                {fill(t('tAllPeak'), {
                  mau: fmtNum(peak.mau),
                  month: peakMonth,
                })}
              </span>
            </li>
          )}
          {latest && (
            <li className="flex flex-wrap gap-x-2 tabular-nums">
              <span className="text-steam-blue/80">{latestMonth}</span>
              <span>
                {fill(t('tLatest'), {
                  mau: fmtNum(latest.mau),
                  month: latestMonth,
                })}
              </span>
            </li>
          )}
        </ol>

        <h3 className="mt-5 text-sm font-semibold text-steam-blue-bright">
          {t('faqTitle')}
        </h3>
        <div className="mt-1.5 space-y-2">
          {(
            [
              ['faq1q', 'faq1a', { date: latestMonth, mau: latest ? fmtNum(latest.mau) : '—' }],
              [
                'faq2q',
                'faq2a',
                {
                  peak: peak ? fmtNum(peak.mau) : '—',
                  peakMonth,
                  csgoPeak: csgoPeak ? fmtNum(csgoPeak.mau) : '—',
                  csgoPeakMonth,
                },
              ],
              ['faq3q', 'faq3a', {}],
              ['faq4q', 'faq4a', {}],
            ] as const
          ).map(([q, a, vars]) => (
            <details
              key={q}
              className="rounded-sm bg-steam-elevated px-4 py-3 ring-1 ring-steam-border/50"
            >
              <summary className="cursor-pointer text-sm font-medium text-steam-text">
                {t(q)}
              </summary>
              <p className="mt-1.5 text-sm leading-relaxed text-steam-muted [overflow-wrap:anywhere]">
                {fill(t(a), vars as Record<string, string>)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
