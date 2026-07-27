import type { MAURecord } from '../types'
import { getPeak, getAvgMAU, getVersionPeak, getYoYGrowth } from '../lib/data'
import { fmtNum } from '../lib/format'

interface Props {
  records: MAURecord[]
}

export default function QuickStats({ records }: Props) {
  const peak = getPeak()?.mau ?? 0
  const avg = getAvgMAU() ?? 0
  const latest = records[records.length - 1]?.mau ?? 0
  const cs2Peak = getVersionPeak('cs2')
  const yoy = getYoYGrowth()
  const peakYear = getPeak()?.date.slice(0, 4) ?? ''
  const yoyPositive = yoy != null && Number(yoy) >= 0

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card label="Peak" value={fmtNum(peak)} sub={peakYear} />
        <Card label="Average" value={fmtNum(avg)} />
        <Card label="Latest" value={fmtNum(latest)} />
        <Card
          label="CS2 Peak"
          value={fmtNum(cs2Peak)}
          color="text-steam-green"
        />
        {yoy && (
          <Card
            label="YoY"
            value={`${yoyPositive ? '+' : ''}${yoy}%`}
            color={yoyPositive ? 'text-steam-green' : 'text-red-400'}
          />
        )}
      </div>
    </div>
  )
}

function Card({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-sm bg-steam-card px-3 py-3 text-center shadow-steam ring-1 ring-steam-border/50">
      <p className="text-xs uppercase tracking-wider text-steam-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${color ?? 'text-steam-text'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-steam-muted">{sub}</p>}
    </div>
  )
}
