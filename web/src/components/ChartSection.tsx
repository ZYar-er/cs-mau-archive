import type { MAURecord } from '../types'
import MAUChart from './MAUChart'

interface Props {
  records: MAURecord[]
}

export default function ChartSection({ records }: Props) {
  if (records.length < 2) {
    return (
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex h-64 items-center justify-center rounded-sm bg-steam-card text-steam-muted shadow-steam ring-1 ring-steam-border/50">
          <div className="text-center">
            <p className="text-lg">Not enough data yet</p>
            <p className="mt-1 text-sm">
              Chart will appear once more data points are collected.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <MAUChart records={records} />
}
