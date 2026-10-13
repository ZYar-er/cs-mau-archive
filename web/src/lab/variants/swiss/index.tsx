import { lazy, Suspense } from 'react'
import {
  getAll,
  getCount,
  getLatest,
  getMoMGrowth,
  getPeak,
  getVersionAvgMAU,
  getVersionPeakRecord,
  getYoYGrowth,
} from '../../../lib/data'
import { fmtNum, fmtGameVersion } from '../../../lib/format'
import { useI18n } from '../../../lib/i18n'
import type { ChartTheme } from '../../../components/MAUChart'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import type { StyleCard, StyleCardProps } from '../../types'
import './swiss.css'

// Type-only import above, so this lazy chunk is the only thing that pulls
// ECharts in — same ~500KB staying out of first paint as in App.tsx.
const MAUChart = lazy(() => import('../../../components/MAUChart'))

/**
 * Re-skins components/MAUChart.tsx without touching a line of its behaviour.
 * Everything here is a colour or a stroke: the card's three flat tones, no
 * gradients, no rounding.
 *
 * Red only ever lands on large type or on graphics, never on small copy —
 * #da291c on #f4f1ec is 4.32:1, which clears AA for large text (3:1) but not
 * for body text (4.5:1).
 */
const SWISS_THEME: ChartTheme = {
  series: {
    color: '#111111',
    width: 1.5,
    // Straight segments — the card wants geometry, not smoothing.
    smooth: false,
    // Flat fill, where the shipping theme uses a vertical gradient.
    area: '#e6e1d8',
  },
  average: { color: '#da291c', width: 1 },
  axis: {
    line: '#cfcac2',
    label: '#111111',
    split: '#cfcac2',
    splitType: 'solid',
    cursor: '#111111',
  },
  tooltip: {
    bg: '#f4f1ec',
    border: '#cfcac2',
    text: '#111111',
    // No greys in this palette, so the trailing line drops to plain ink.
    muted: '#111111',
    // Square markers, not circles. The layout itself is the chart's, shared
    // with the shipping page — this theme only recolours it.
    dotRadius: '0',
  },
  markers: {
    // One ink for every event; the all-time peak carries the red instead.
    tones: ['#111111', '#111111', '#111111'],
    csgoPeak: '#111111',
    peak: '#da291c',
  },
  slider: {
    border: '#cfcac2',
    background: '#f4f1ec',
    filler: 'rgba(218, 41, 28, 0.1)',
    trackLine: '#cfcac2',
    trackArea: 'rgba(17, 17, 17, 0.06)',
    selectedLine: '#111111',
    selectedArea: 'rgba(17, 17, 17, 0.08)',
    // Ink, not paper: the slider's own background is paper too, so a paper
    // handle has no fill contrast against its track and disappears (ECharts
    // draws no border on it by default, so the fill is all there is).
    handle: '#111111',
    handleBorder: '#111111',
    // ECharts' default grip is a rounded rect; this card forbids radii. Same
    // 8x25 box as the default (`...m-2,0h4v25h-4Z` would only be 4 wide — the
    // default's width comes from h4 plus the two r=2 corner arcs), corners
    // squared off.
    handleIcon: 'path://M-9.35,34.56V42m0-40V9.5m-4,0h8v25h-8Z',
    text: '#111111',
  },
}

// Historical fixed event dates. components/InfoSection.tsx and the EVENTS table
// in components/MAUChart.tsx each keep their own copy, and both live outside a
// variant's remit — so this is a third copy rather than a shared import. If
// these dates ever move, all three need updating. See AGENTS.md 统计口径.
const MILESTONES = [
  { date: '2012-08-21', labelKey: 'tCsgoLaunch' },
  { date: '2018-12-06', labelKey: 'tF2p' },
  { date: '2023-03-22', labelKey: 'tCs2Ann' },
  { date: '2023-09-27', labelKey: 'tCs2Launch' },
] as const

// CS2's first monthly record — same constant as components/QuickStats.tsx.
const CS2_FIRST_MONTH = '2023-09'

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    template,
  )
}

/** A hairline spanning the outermost grid columns. */
function Rule() {
  return (
    <div className="v-swiss__wrap">
      <hr className="v-swiss__rule" />
    </div>
  )
}

function Growth({ label, value }: { label: string; value: string }) {
  const positive = Number(value) >= 0
  // Latin labels are split so the two rows can be spread to an identical block
  // width — "MOM" is 4px wider than "YOY" as plain text. See swiss.css.
  const spread = /^[A-Za-z]+$/.test(label)
  return (
    <p className="v-swiss__growth">
      <span
        className={
          spread ? 'v-swiss__label v-swiss__label--spread' : 'v-swiss__label'
        }
      >
        {spread
          ? [...label].map((char, index) => <span key={index}>{char}</span>)
          : label}
      </span>
      {/* A flat triangle, not colour: the palette has no "good"/"bad" axis. */}
      <svg viewBox="0 0 10 8" aria-hidden="true" width="10" height="8">
        <path
          d={positive ? 'M5 0 L10 8 H0 Z' : 'M5 8 L0 0 H10 Z'}
          fill="var(--ink)"
        />
      </svg>
      <span className="v-swiss__growth-value">
        {positive ? '+' : ''}
        {value}%
      </span>
    </p>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="v-swiss__stat">
      <p className="v-swiss__stat-label">{label}</p>
      <p className="v-swiss__stat-value">{value}</p>
      <p className="v-swiss__stat-sub">{sub}</p>
    </div>
  )
}

function SwissPage({ onLanguageToggle }: StyleCardProps) {
  const { t } = useI18n()
  const records = getAll()
  const latest = getLatest()
  const count = getCount()

  if (!latest || count === 0) {
    return <div className="v-swiss" />
  }

  const peak = getPeak()
  const csgoPeak = getVersionPeakRecord('csgo')
  const cs2Average = getVersionAvgMAU('cs2')
  const mom = getMoMGrowth()
  const yoy = getYoYGrowth()

  // ISO month strings throughout: no locale-specific date formatting, and it
  // is what the grid wants anyway.
  const firstMonth = records[0].date.slice(0, 7)
  const lastMonth = records[count - 1].date.slice(0, 7)
  const range = `${firstMonth} → ${lastMonth}`
  const peakMonth = peak?.date.slice(0, 7) ?? ''
  const csgoPeakMonth = csgoPeak?.date.slice(0, 7) ?? ''
  const apiStamp = latest.api_timestamp
    ? `${latest.api_timestamp.slice(0, 16).replace('T', ' ')} UTC`
    : ''

  const timeline = [
    ...MILESTONES.map((milestone) => ({
      date: milestone.date.slice(0, 7),
      label: t(milestone.labelKey),
    })),
    ...(csgoPeak
      ? [
          {
            date: csgoPeakMonth,
            label: fill(t('tCsgoPeak'), {
              mau: fmtNum(csgoPeak.mau),
              month: csgoPeakMonth,
            }),
          },
        ]
      : []),
    ...(peak
      ? [
          {
            date: peakMonth,
            label: fill(t('tAllPeak'), {
              mau: fmtNum(peak.mau),
              month: peakMonth,
            }),
          },
        ]
      : []),
    {
      date: lastMonth,
      label: fill(t('tLatest'), {
        mau: fmtNum(latest.mau),
        month: lastMonth,
      }),
    },
  ]

  const faqs = [
    { q: 'faq1q', a: 'faq1a', vars: { date: lastMonth, mau: fmtNum(latest.mau) } },
    {
      q: 'faq2q',
      a: 'faq2a',
      vars: {
        peak: fmtNum(peak?.mau ?? 0),
        peakMonth,
        csgoPeak: fmtNum(csgoPeak?.mau ?? 0),
        csgoPeakMonth,
      },
    },
    { q: 'faq3q', a: 'faq3a', vars: {} },
    { q: 'faq4q', a: 'faq4a', vars: {} },
  ] as const

  return (
    <div className="v-swiss">
      {/* Shipping chrome. Header, Footer and MAUChart are all re-skinned from
          CSS rather than reimplemented — same markup, same layout, same
          links; only the skin changes. */}
      <Header onLanguageToggle={onLanguageToggle} />

      <main>
        <section className="v-swiss__section v-swiss__section--lead">
          <div className="v-swiss__wrap v-swiss__grid">
            {/* The figure carries this section, so the h1 is its caption
                rather than a headline — same division of labour as
                components/HeroSection.tsx. */}
            <div className="v-swiss__hero">
              <h1 className="v-swiss__h1">{t('heroTitle')}</h1>

              <p className="v-swiss__display">{fmtNum(latest.mau)}</p>
            </div>

            <div className="v-swiss__herometa v-swiss__meta">
              <span>{t('asOf').replace('{date}', lastMonth)}</span>
              <span>
                {t('game')} {fmtGameVersion(latest.game_version)}
              </span>
              {apiStamp && (
                <span>
                  {t('apiUpdated')} {apiStamp}
                </span>
              )}
            </div>

            <div className="v-swiss__herogrowth">
              {mom && <Growth label={t('mom')} value={mom} />}
              {yoy && <Growth label={t('yoy')} value={yoy} />}
            </div>

            {/* One block, its own 12-column track: on phones the right-hand
                column starts a column earlier than a 6/6 split would put it,
                which is what buys "records 2013-10 → 2026-09" the width to
                stay on one line. */}
            <div className="v-swiss__stats">
              {peak && (
                <Stat
                  label={t('peak')}
                  value={fmtNum(peak.mau)}
                  sub={peakMonth}
                />
              )}
              {csgoPeak && (
                <Stat
                  label={t('csgoPeak')}
                  value={fmtNum(csgoPeak.mau)}
                  sub={csgoPeakMonth}
                />
              )}
              {cs2Average != null && (
                <Stat
                  label={t('cs2Average')}
                  value={fmtNum(cs2Average)}
                  sub={t('cs2AverageSub').replace('{month}', CS2_FIRST_MONTH)}
                />
              )}
              <Stat
                label={t('archive')}
                value={fmtNum(count)}
                sub={t('recordsSub').replace('{range}', range)}
              />
            </div>
          </div>
        </section>

        <Rule />

        <section className="v-swiss__section" aria-label={t('chartTitle')}>
          <div className="v-swiss__wrap v-swiss__grid">
            {/* No heading here on purpose: MAUChart prints the same title in
                its own header, and an h2 above it just repeated the line. The
                section keeps its accessible name through aria-label. */}

            {/* The shipping chart, re-skinned. Zoom, snapping, the
                auto-adapting y-axis, tooltip, range buttons and the bottom
                stats row are all untouched — MAUChart only reads colours from
                SWISS_THEME, and swiss.css restyles its chrome. */}
            <Suspense fallback={<div className="v-swiss__chart-fallback" />}>
              <MAUChart records={records} theme={SWISS_THEME} />
            </Suspense>
          </div>
        </section>

        <Rule />

        <section className="v-swiss__section">
          <div className="v-swiss__wrap v-swiss__grid">
            <h2 className="v-swiss__sectiontitle">{t('timelineTitle')}</h2>

            <ol className="v-swiss__timeline">
              {timeline.map((entry, index) => (
                <li
                  key={`${entry.date}-${index}`}
                  className="v-swiss__timeline-row"
                >
                  <span className="v-swiss__timeline-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="v-swiss__timeline-date">{entry.date}</span>
                  <span className="v-swiss__timeline-label">{entry.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Rule />

        <section className="v-swiss__section">
          <div className="v-swiss__wrap v-swiss__grid">
            <h2 className="v-swiss__sectiontitle">{t('aboutTitle')}</h2>

            <div className="v-swiss__prose">
              <h3 className="v-swiss__prose-title">{t('methodTitle')}</h3>
              <p>{t('methodP1')}</p>
              <p>{t('methodP2')}</p>
              <p>{fill(t('methodP3'), { count, range })}</p>
            </div>

            <dl className="v-swiss__faq">
              {faqs.map(({ q, a, vars }) => (
                <div key={q} className="v-swiss__faq-item">
                  <dt>{t(q)}</dt>
                  <dd>{fill(t(a), vars as Record<string, string>)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

const swiss: StyleCard = {
  slug: 'swiss',
  title: 'Swiss',
  note: '瑞士国际主义：12 栏网格、新怪诞体、黑/米白/强调红三色平涂。',
  Component: SwissPage,
}

export default swiss
