export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtDate(iso: string, locale = 'en-US'): string {
  if (locale.startsWith('zh')) return iso.slice(0, 10)
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Display labels for the `game_version` values stored in the records. The data
// keeps its bare keys ('csgo' | 'cs2') — they're used for filtering — but the
// site spells the label with a colon, so a bare `toUpperCase()` would drop it.
const GAME_VERSION_LABELS: Record<string, string> = {
  csgo: 'CS:GO',
  cs2: 'CS2',
}

export function fmtGameVersion(version: string): string {
  return GAME_VERSION_LABELS[version] ?? version.toUpperCase()
}

// Month-only label for monthly series: 2026-09-01 → "Sep 2026" (en) /
// "2026-09" (zh). Records land on the 1st of the month, so the day is noise
// wherever it would only repeat the axis tick above it.
export function fmtMonth(iso: string, locale = 'en-US'): string {
  if (locale.startsWith('zh')) return iso.slice(0, 7)
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

// Compact MAU for axis labels: 32,387,073 → "32.39M"
export function fmtMAU(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
