export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Compact MAU for axis labels: 32,387,073 → "32.39M"
export function fmtMAU(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// "2013/10" for axis ticks
export function fmtMonthShort(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// "Oct 2013" for tooltip
export function fmtYearMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}
