import type { MAURecord } from '../types'
import dailyJson from '../data/daily.json'
import historyJson from '../data/history.json'

const dailyRecords = (dailyJson as MAURecord[]).slice()
const historyRecords = (historyJson as MAURecord[]).slice()

const deduped = new Map<string, MAURecord>()

for (const r of historyRecords) {
  const existing = deduped.get(r.date)
  if (existing && existing.mau !== r.mau) {
    console.warn(
      `[data] duplicate month ${r.date}: ${existing.source}=${existing.mau} overridden by ${r.source}=${r.mau}`,
    )
  }
  deduped.set(r.date, r)
}

for (const r of dailyRecords) {
  // Daily data is always the latest source, overwrite anything else
  const existing = deduped.get(r.date)
  if (existing && existing.mau !== r.mau) {
    console.warn(
      `[data] duplicate month ${r.date}: ${existing.source}=${existing.mau} overridden by ${r.source}=${r.mau}`,
    )
  }
  deduped.set(r.date, r)
}

const records: MAURecord[] = Array.from(deduped.values()).sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
)

export function getAll(): MAURecord[] {
  return records
}

export function getLatest(): MAURecord | null {
  if (records.length === 0) return null
  return records[records.length - 1]
}

export function getPrevious(): MAURecord | null {
  if (records.length < 2) return null
  return records[records.length - 2]
}

export function getCount(): number {
  return records.length
}

export function getYoYGrowth(): string | null {
  const latest = getLatest()
  if (!latest || records.length < 2) return null

  const prevYear = records.find(
    (r) =>
      r.date.slice(0, 7) ===
      `${Number(latest.date.slice(0, 4)) - 1}-${latest.date.slice(5, 7)}`,
  )
  if (!prevYear) return null

  return (((latest.mau - prevYear.mau) / prevYear.mau) * 100).toFixed(1)
}

export function getMoMGrowth(): string | null {
  const latest = getLatest()
  if (!latest || records.length < 2) return null

  // Previous month is the record immediately before the latest
  const prev = records[records.length - 2]
  if (!prev) return null

  return (((latest.mau - prev.mau) / prev.mau) * 100).toFixed(1)
}

export function getPeak(): MAURecord | null {
  if (records.length === 0) return null
  return records.reduce((a, b) => (b.mau > a.mau ? b : a))
}

export function getVersionMinMAU(version: string): number | null {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return null
  return Math.min(...versionRecords.map((r) => r.mau))
}

export function getVersionMinRecord(version: string): MAURecord | null {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return null
  return versionRecords.reduce((a, b) => (b.mau < a.mau ? b : a))
}

export function getAvgMAU(): number | null {
  if (records.length === 0) return null
  return Math.round(records.reduce((s, r) => s + r.mau, 0) / records.length)
}

export function getVersionAvgMAU(version: string): number | null {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return null
  return Math.round(
    versionRecords.reduce((s, r) => s + r.mau, 0) / versionRecords.length,
  )
}

export function getVersionPeak(version: string): number {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return 0
  return Math.max(...versionRecords.map((r) => r.mau))
}

export function getVersionPeakRecord(version: string): MAURecord | null {
  const versionRecords = records.filter((r) => r.game_version === version)
  if (versionRecords.length === 0) return null
  return versionRecords.reduce((a, b) => (b.mau > a.mau ? b : a))
}
