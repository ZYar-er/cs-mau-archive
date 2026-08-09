import {
  getPeak,
  getVersionAvgMAU,
  getVersionMinRecord,
  getVersionPeakRecord,
  getYoYGrowth,
  getMoMGrowth,
} from '../lib/data'
import { fmtNum } from '../lib/format'
import { useI18n } from '../lib/i18n'

const CS2_FIRST_MONTH = '2023-09'
const CSGO_PEAK_MONTH = '2023-04'

export default function QuickStats() {
  const { t } = useI18n()

  const peak = getPeak()?.mau ?? 0
  const avg = getVersionAvgMAU('cs2')
  const cs2LowestRecord = getVersionMinRecord('cs2')
  const cs2Lowest = cs2LowestRecord?.mau ?? null
  const cs2LowestMonth = cs2LowestRecord?.date?.slice(0, 7) ?? ''
  const csgoPeakRecord = getVersionPeakRecord('csgo')
  const csgoPeak = csgoPeakRecord?.mau ?? null
  const mom = getMoMGrowth()
  const yoy = getYoYGrowth()
  const peakMonth = getPeak()?.date?.slice(0, 7) ?? ''
  const momPositive = mom != null && Number(mom) >= 0
  const yoyPositive = yoy != null && Number(yoy) >= 0

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card
        label={t('peak')}
        value={fmtNum(peak)}
        sub={peakMonth}
        color="text-steam-blue"
        highlight
      />
      <Card
        label={t('cs2Lowest')}
        value={cs2Lowest != null ? fmtNum(cs2Lowest) : '—'}
        sub={cs2LowestMonth}
      />
      <Card
        label={t('csgoPeak')}
        value={csgoPeak != null ? fmtNum(csgoPeak) : '—'}
        sub={CSGO_PEAK_MONTH}
      />
      <Card
        label={t('cs2Average')}
        value={avg != null ? fmtNum(avg) : '—'}
        sub={t('cs2AverageSub').replace('{month}', CS2_FIRST_MONTH)}
      />
      {mom && (
        <Card
          label={t('mom')}
          value={`${momPositive ? '+' : ''}${mom}%`}
          color={momPositive ? 'text-steam-green' : 'text-red-400'}
        />
      )}
      {yoy && (
        <Card
          label={t('yoy')}
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
      className={`flex flex-col items-center justify-center rounded-sm bg-steam-card px-2 py-1.5 text-center shadow-steam ring-1 sm:min-h-[72px] ${
        highlight ? 'ring-steam-blue/40' : 'ring-steam-border/50'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-steam-muted sm:text-xs">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums sm:text-base ${color ?? 'text-steam-text'}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[11px] tabular-nums text-steam-muted sm:text-xs">
          {sub}
        </p>
      )}
    </div>
  )
}
