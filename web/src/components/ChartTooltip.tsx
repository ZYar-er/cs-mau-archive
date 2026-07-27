import type { MAURecord } from '../types'
import { fmtYearMonth, fmtNum } from '../lib/format'

interface Props {
  record: MAURecord
  ma6: number | null
  x: number
  y: number
  width: number
}

export default function ChartTooltip({ record, ma6, x, y, width }: Props) {
  // Flip tooltip to left side if it would overflow the right edge
  const left = x > width - 160 ? x - 150 : x + 12
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-sm border border-steam-border bg-steam-card px-3 py-2 text-xs shadow-steam-lg"
      style={{ left, top: Math.max(8, y - 60) }}
    >
      <p className="mb-1 text-steam-blue">{fmtYearMonth(record.date)}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-steam-blue" />
        <span className="text-steam-muted">MAU:</span>
        <span className="font-mono text-steam-text">{fmtNum(record.mau)}</span>
      </div>
      {ma6 != null && (
        <div className="mt-0.5 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f5c542]" />
          <span className="text-steam-muted">6mo avg:</span>
          <span className="font-mono text-steam-text">{fmtNum(ma6)}</span>
        </div>
      )}
      <p className="mt-0.5 text-steam-muted">{record.game_version.toUpperCase()}</p>
    </div>
  )
}
