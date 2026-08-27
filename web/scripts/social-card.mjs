// Generates the 1200x630 Open Graph card from the latest committed record.
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const output = resolve(root, 'web', 'public', 'social-card.png')

const byDate = new Map()
for (const name of ['history.json', 'daily.json']) {
  const values = JSON.parse(readFileSync(resolve(root, 'data', name), 'utf-8'))
  for (const value of values) byDate.set(value.date, value)
}
const records = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
if (records.length < 2) throw new Error('[social-card] Not enough data')

const first = records[0]
const latest = records[records.length - 1]
const peak = records.reduce((best, item) =>
  item.mau > best.mau ? item : best,
)
const minimum = Math.min(...records.map((item) => item.mau))
const maximum = Math.max(...records.map((item) => item.mau))
const monthYear = new Date(`${latest.date}T00:00:00Z`).toLocaleDateString(
  'en-US',
  { month: 'short', year: 'numeric', timeZone: 'UTC' },
)
const number = (value) => value.toLocaleString('en-US')
const compact = (value) => `${(value / 1_000_000).toFixed(1)}M`

const points = records.map((record, index) => {
  const x = 650 + (index / (records.length - 1)) * 500
  const normalized = (record.mau - minimum) / (maximum - minimum || 1)
  const y = 405 - normalized * 190
  return `${x.toFixed(1)},${y.toFixed(1)}`
})

const generatedAt =
  latest.api_timestamp ?? latest.wayback_timestamp ?? latest.date
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" color="#101823"/>
      <stop offset="1" color="#182535"/>
    </linearGradient>
    <linearGradient id="trend" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" color="#4b91c7"/>
      <stop offset=".55" color="#66c0f4"/>
      <stop offset="1" color="#95e06c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#surface)"/>
  <rect x="80" y="56" width="320" height="36" rx="7" fill="#253c51"/>
  <text x="240" y="80" fill="#8ac9ef" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1.5" text-anchor="middle">STEAM WEB API + ARCHIVE</text>
  <text x="82" y="166" fill="#ffffff" font-family="Arial,sans-serif" font-size="58" font-weight="700">CS2 Player Count</text>
  <text x="82" y="272" fill="#66c0f4" font-family="Arial,sans-serif" font-size="86" font-weight="700">${number(latest.mau)}</text>
  <text x="84" y="318" fill="#aab8c5" font-family="Arial,sans-serif" font-size="24">${monthYear} MAU · records since ${first.date.slice(0, 4)}</text>
  <rect x="80" y="366" width="450" height="96" rx="10" fill="#1c2836" stroke="#375264"/>
  <text x="106" y="400" fill="#899eaf" font-family="Arial,sans-serif" font-size="16" letter-spacing="1.1">ALL-TIME PEAK</text>
  <text x="106" y="438" fill="#f2fbff" font-family="Arial,sans-serif" font-size="31" font-weight="700">${number(peak.mau)} · ${peak.date.slice(0, 7)}</text>

  <polyline points="${points.join(' ')}" fill="none" stroke="url(#trend)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".94"/>
  <circle cx="${points.at(-1).split(',')[0]}" cy="${points.at(-1).split(',')[1]}" r="10" fill="#95e06c" stroke="#14202c" stroke-width="4"/>
  <text x="1150" y="445" fill="#8898a7" font-family="Arial,sans-serif" font-size="19" text-anchor="end">${compact(latest.mau)}</text>

  <line x1="82" y1="532" x2="1148" y2="532" stroke="#33506b" stroke-width="1"/>
  <text x="82" y="576" fill="#bccbd7" font-family="Arial,sans-serif" font-size="23" font-weight="700">csmau.zyar.top</text>
  <text x="1148" y="576" fill="#8898a7" font-family="Arial,sans-serif" font-size="19" text-anchor="end">Steam Web API · Wayback Machine</text>
  <!-- Generated artifact; the timestamp records the source data revision. -->
  <metadata>${generatedAt}</metadata>
</svg>`

const temporaryDir = mkdtempSync(join(tmpdir(), 'cs-mau-social-'))
const temporarySvg = join(temporaryDir, 'social-card.svg')
writeFileSync(temporarySvg, svg)

try {
  // NPM lifecycle environments may miss distro binaries from PATH even when a
  // parent shell finds them, so call the standard Arch/Ubuntu location too.
  const converter = ['/usr/bin/rsvg-convert', 'rsvg-convert'].find((command) =>
    existsSync(command),
  )
  if (!converter) throw new Error('rsvg-convert is required to refresh the social card')
  execFileSync(converter, ['-w', '1200', '-h', '630', temporarySvg, '-o', output])
  console.log(`[social-card] wrote ${output}`)
} catch (error) {
  if (!existsSync(output)) throw error
  if (process.argv.includes('--strict')) throw error
  console.warn('[social-card] rsvg-convert unavailable; kept existing PNG')
} finally {
  rmSync(temporaryDir, { recursive: true, force: true })
}
