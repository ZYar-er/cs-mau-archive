import Header from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'
import ChartSection from './components/ChartSection'
import { getLatest, getAll, getYoYGrowth, getMoMGrowth, getCount } from './lib/data'

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
          records={records}
        />
        <div className="mt-3">
          <ChartSection records={records} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
