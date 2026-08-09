import Header from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import ChartSection from './components/ChartSection'
import { getLatest, getAll, getYoYGrowth, getMoMGrowth, getCount } from './lib/data'
import { useI18n } from './lib/i18n'

export default function App() {
  const { t } = useI18n()
  const latest = getLatest()
  const records = getAll()

  if (!latest || records.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-steam-bg">
        <Header />
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
      <Header />
      <main className="flex-1 pb-4">
        <HeroSection
          latest={latest}
          yoyGrowth={yoyGrowth}
          momGrowth={momGrowth}
          count={count}
        />
        <div className="mt-3">
          <ChartSection records={records} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
