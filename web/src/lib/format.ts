export function fmtNum(n: number): string {
  return n.toLocaleString('en-US')
}

export function fmtDate(iso: string, locale = 'en-US'): string {
  if (locale.startsWith('zh')) return iso.slice(0, 10)
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
