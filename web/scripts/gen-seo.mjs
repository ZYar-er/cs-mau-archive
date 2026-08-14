// Generates SEO artifacts from the committed data files (run before every
// dev/build via npm predev/prebuild):
//   - patches web/index.html SEO tokens (title, description, OG, JSON-LD)
//   - writes web/public/robots.txt and web/public/sitemap.xml
//   - copies data/*.json into web/public/data/ so the raw dataset is crawlable
//     at https://csmau.zyar.top/data/*.json (referenced by the Dataset schema)
// Idempotent: only rewrites a file when its content actually changed.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const webDir = resolve(root, 'web')
const dataDir = resolve(root, 'data')
const publicDir = resolve(webDir, 'public')

const SITE = 'https://csmau.zyar.top'
const SITE_ZH = `${SITE}/?lang=zh`
const REPO = 'https://github.com/ZYar-er/cs-mau-archive'

const fmt = (n) => n.toLocaleString('en-US')
const fmtCompact = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)
const monthName = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
const monthYear = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

// --- load & merge the dataset (mirrors web/src/lib/data.ts) ---
const load = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return fallback
  }
}
const byDate = new Map()
for (const r of [
  ...load(resolve(dataDir, 'history.json'), []),
  ...load(resolve(dataDir, 'daily.json'), []),
]) {
  byDate.set(r.date, r)
}
const records = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
const latest = records[records.length - 1] ?? null
const peak = records.length
  ? records.reduce((a, b) => (b.mau > a.mau ? b : a))
  : null
const csgoRecords = records.filter((r) => r.game_version === 'csgo')
const csgoPeak = csgoRecords.length
  ? csgoRecords.reduce((a, b) => (b.mau > a.mau ? b : a))
  : null

const range =
  records.length >= 2
    ? `${records[0].date.slice(0, 7)}/${records[records.length - 1].date.slice(0, 7)}`
    : ''

// --- meta content (fall back to generic strings if data is missing) ---
const title = latest
  ? `CS2 Player Count: ${fmtCompact(latest.mau)} Monthly Players | CS MAU Tracker`
  : 'CS2 & CS:GO Monthly Active Players | CS MAU Tracker'
const description = latest
  ? `CS2 monthly active players: ${fmt(latest.mau)} as of ${monthYear(latest.date)}; all-time peak ${fmt(peak?.mau ?? 0)}; records from 2013-10 onward via Steam Web API & Wayback Machine.`
  : 'Historical monthly active users (MAU) for Counter-Strike (CS:GO → CS2), via Steam Web API and Wayback Machine.'
const ogTitle = latest
  ? `CS2 Player Count — ${fmtCompact(latest.mau)} Monthly Active Players (${monthYear(latest.date)})`
  : title

const datasetJsonLd = latest
  ? {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Counter-Strike Monthly Active Users (MAU), 2013-10 to present',
      description,
      url: SITE,
      creator: { '@type': 'Organization', name: 'CS MAU Tracker', url: REPO },
      dateModified: latest.date,
      temporalCoverage: range || undefined,
      variableMeasured: {
        '@type': 'PropertyValue',
        name: 'Monthly Active Users (MAU)',
        unitText: 'players',
      },
      distribution: [
        {
          '@type': 'DataDownload',
          contentUrl: `${SITE}/data/history.json`,
          encodingFormat: 'application/json',
        },
        {
          '@type': 'DataDownload',
          contentUrl: `${SITE}/data/daily.json`,
          encodingFormat: 'application/json',
        },
      ],
    }
  : null

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'CS MAU Tracker',
      url: SITE,
      description,
      inLanguage: ['en', 'zh'],
    },
    ...(datasetJsonLd ? [datasetJsonLd] : []),
  ],
}

// --- patch web/index.html tokens ---
const indexPath = resolve(webDir, 'index.html')
let indexHtml = readFileSync(indexPath, 'utf-8')
const replacements = [
  ['__SEO_TITLE__', title],
  ['__SEO_DESC__', description],
  ['__SEO_OG_TITLE__', ogTitle],
  ['__SEO_OG_DESC__', description],
  [
    '__SEO_JSONLD__',
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(
      /</g,
      '\\u003c',
    )}</script>`,
  ],
]
for (const [token, value] of replacements) {
  if (indexHtml.includes(token)) indexHtml = indexHtml.split(token).join(value)
}
if (indexHtml !== readFileSync(indexPath, 'utf-8')) {
  writeFileSync(indexPath, indexHtml)
  console.log('[gen-seo] patched web/index.html meta tags')
}

// --- write robots.txt (keeps the site's AI-training crawler policy; search
// engines stay fully allowed) ---
const robots = `# CS MAU Tracker — robots.txt (generated by scripts/gen-seo.mjs)
# Search engines are fully allowed. AI-training/extended crawlers are blocked;
# this does NOT affect Google/Bing indexing (Google-Extended is separate from
# Googlebot).

User-agent: *
Allow: /
Sitemap: ${SITE}/sitemap.xml

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /
`
const writeIfChanged = (file, content) => {
  const existing = existsSync(file) ? readFileSync(file, 'utf-8') : null
  if (existing !== content) {
    writeFileSync(file, content)
    console.log(`[gen-seo] wrote ${file.replace(root, '')}`)
  }
}
writeIfChanged(resolve(publicDir, 'robots.txt'), robots)

// --- sitemap.xml (en + zh alternate URLs, lastmod = latest data month) ---
const lastmod = latest?.date ?? new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/" />
    <xhtml:link rel="alternate" hreflang="zh" href="${SITE_ZH}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/" />
  </url>
  <url>
    <loc>${SITE_ZH}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/" />
    <xhtml:link rel="alternate" hreflang="zh" href="${SITE_ZH}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/" />
  </url>
</urlset>
`
writeIfChanged(resolve(publicDir, 'sitemap.xml'), sitemap)

// --- copy raw dataset into public/data/ (crawlable JSON for Dataset schema) ---
mkdirSync(resolve(publicDir, 'data'), { recursive: true })
cpSync(dataDir, resolve(publicDir, 'data'), {
  recursive: true,
  filter: (src) => !src.includes('__pycache__'),
})
console.log('[gen-seo] copied data/*.json -> web/public/data/')

console.log('[gen-seo] done.')
