import { lazy, Suspense } from 'react'
import Header, { type HeaderProps } from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import InfoSection from './components/InfoSection'
import { getLatest, getAll, getYoYGrowth, getMoMGrowth, getCount } from './lib/data'
import { useI18n } from './lib/i18n'

// ECharts (~500KB) is split into its own chunk: only loaded after first paint.
const ChartSection = lazy(() => import('./components/ChartSection'))

// Suspense fallback matches the chart card's height so hydration (which also
// renders this fallback) is stable and there is no layout shift.
function ChartFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="rounded-sm bg-steam-card px-4 py-3 shadow-steam ring-1 ring-steam-border/50 sm:px-5">
        <div className="h-[280px] sm:h-[340px]" />
      </div>
    </div>
  )
}

/**
 * The shipping page, and the body of the `baseline` style card
 * (styles/variants/baseline.tsx re-exports it unchanged, so the two cannot
 * drift). Its props are the header's, forwarded straight through — this page
 * has no chrome of its own to drive.
 */
export default function App({
  onLanguageToggle,
  styleSwitch,
}: HeaderProps = {}) {
  const { t } = useI18n()
  const latest = getLatest()
  const records = getAll()

  if (!latest || records.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-steam-bg">
        <Header onLanguageToggle={onLanguageToggle} styleSwitch={styleSwitch} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center text-steam-muted">
            <p className="text-lg sm:text-xl">{t('noData')}</p>
            <p className="mt-1 text-sm sm:text-base">
              {t('syncHint').split('{cmd}')[0]}
              <code className="rounded bg-steam-card px-1 py-0.5 text-xs">
                npm run predev
              </code>{' '}
              {t('syncHint').split('{cmd}')[1]}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const yoyGrowth = getYoYGrowth()
  const momGrowth = getMoMGrowth()
  const count = getCount()

  return (
    <div className="flex min-h-screen flex-col bg-steam-bg">
      <Header onLanguageToggle={onLanguageToggle} styleSwitch={styleSwitch} />
      <main className="flex-1 pb-4">
        <HeroSection
          latest={latest}
          yoyGrowth={yoyGrowth}
          momGrowth={momGrowth}
          count={count}
        />
        <div className="mt-3">
          <Suspense fallback={<ChartFallback />}>
            <ChartSection records={records} />
          </Suspense>
        </div>
        <InfoSection records={records} />
      </main>
      <Footer />
    </div>
  )
}
