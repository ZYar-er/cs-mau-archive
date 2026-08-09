import type { MAURecord } from '../types'
import {
  getPeak,
  getVersionAvgMAU,
  getVersionPeakRecord,
  getYoYGrowth,
} from '../lib/data'
import { fmtNum } from '../lib/format'

interface Props {
  records: MAURecord[]
}

export default function QuickStats({ records }: Props) {
  const peak = getPeak()?.mau ?? 0
  const avg = getVersionAvgMAU('cs2') ?? 0
  const latest = records[records.length - 1]?.mau ?? 0
  const cs2PeakRecord = getVersionPeakRecord('cs2')
  const cs2Peak = cs2PeakRecord?.mau ?? 0
  const cs2PeakMonth = cs2PeakRecord?.date?.slice(0, 7) ?? ''
  const csgoPeakRecord = getVersionPeakRecord('csgo')
  const csgoPeak = csgoPeakRecord?.mau ?? 0
  const csgoPeakMonth = csgoPeakRecord?.date?.slice(0, 7) ?? ''
  const yoy = getYoYGrowth()
  const peakMonth = getPeak()?.date?.slice(0, 7) ?? ''
  const yoyPositive = yoy != null && Number(yoy) >= 0

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card
        label="Peak"
        value={fmtNum(peak)}
        sub={peakMonth}
        color="text-steam-blue"
        highlight
      />
      <Card label="CS2 Average" value={fmtNum(avg)} />
      <Card label="Latest" value={fmtNum(latest)} />
      <Card
        label="CS:GO Peak"
        value={fmtNum(csgoPeak)}
        sub={csgoPeakMonth}
      />
      <Card
        label="CS2 Peak"
        value={fmtNum(cs2Peak)}
        sub={cs2PeakMonth}
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
  )
}

function Card({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-sm bg-steam-card px-2 py-1.5 text-center shadow-steam ring-1 ${
        highlight ? 'ring-steam-blue/40' : 'ring-steam-border/50'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${color ?? 'text-steam-text'}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] tabular-nums text-steam-muted">
          {sub}
        </p>
      )}
    </div>
  )
}
