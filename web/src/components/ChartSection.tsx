import type { MAURecord } from '../types'
import MAUChart from './MAUChart'
import { useI18n } from '../lib/i18n'

interface Props {
  records: MAURecord[]
}

export default function ChartSection({ records }: Props) {
  const { t } = useI18n()

  if (records.length < 2) {
    return (
      <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="flex h-40 items-center justify-center rounded-sm bg-steam-card text-steam-muted shadow-steam ring-1 ring-steam-border/50 sm:h-56">
          <div className="text-center">
            <p className="text-lg sm:text-xl">{t('notEnough')}</p>
            <p className="mt-1 text-sm sm:text-base">{t('chartHint')}</p>
          </div>
        </div>
      </div>
    )
  }

  return <MAUChart records={records} />
}
