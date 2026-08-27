// Generates localized metadata, structured data, crawler files, and the
// crawlable data bundle from the committed records. Runs before dev/build.
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
const SITE_ZH = `${SITE}/zh/`
const REPO = 'https://github.com/ZYar-er/cs-mau-archive'

const fmt = (n) => n.toLocaleString('en-US')
const fmtCompact = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : String(n)
const fmtWan = (n) => {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}亿`
  if (n >= 10_000)
    return `${(n / 10_000).toLocaleString('zh-CN', {
      maximumFractionDigits: 1,
    })}万`
  return String(n)
}
const enMonthYear = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
const zhMonthYear = (date) => {
  const [year, month] = date.split('-')
  return `${year}年${Number(month)}月`
}
const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// Merge history and live API records by month; daily overrides archive.
const load = (path, fallback) => {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'))
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}
const byDate = new Map()
for (const record of [
  ...load(resolve(dataDir, 'history.json'), []),
  ...load(resolve(dataDir, 'daily.json'), []),
]) {
  byDate.set(record.date, record)
}
const records = [...byDate.values()].sort((a, b) =>
  a.date.localeCompare(b.date),
)
const latest = records[records.length - 1] ?? null
const csgoRecords = records.filter((record) => record.game_version === 'csgo')
const peak = records.reduce(
  (max, record) => (record.mau > max.mau ? record : max),
  records[0],
)
const csgoPeak = csgoRecords.reduce(
  (max, record) => (record.mau > max.mau ? record : max),
  csgoRecords[0],
)
const range =
  latest && records[0]
    ? `${records[0].date.slice(0, 7)}/${latest.date.slice(0, 7)}`
    : ''
const modifiedAt =
  latest?.api_timestamp ?? latest?.wayback_timestamp ?? latest?.date ?? null

if (!latest || !peak || !csgoPeak) {
  throw new Error('[gen-seo] data/history.json contains no usable MAU records')
}

const enFaq = [
  {
    question: 'How many people play CS2 right now?',
    answer: `As of ${enMonthYear(latest.date)}, Counter-Strike 2 had ${fmt(latest.mau)} monthly active players. Valve publishes this figure once per month on the 1st at 07:00 UTC.`,
  },
  {
    question: 'What is the highest player count ever recorded?',
    answer: `The all-time peak is ${fmt(peak.mau)} monthly active players, reached in ${enMonthYear(peak.date)}. CS:GO itself peaked at ${fmt(csgoPeak.mau)} in ${enMonthYear(csgoPeak.date)} before the transition to CS2.`,
  },
  {
    question: 'Where does this data come from?',
    answer:
      'From the official Steam Web API used by counter-strike.net, plus Wayback Machine snapshots of that site for the years before the API existed.',
  },
  {
    question: 'How often is this page updated?',
    answer:
      'Once a month, automatically, shortly after Valve publishes the new figure.',
  },
]

const zhFaq = [
  {
    question: '现在有多少人在玩 CS2？',
    answer: `截至${zhMonthYear(latest.date)}，Counter-Strike 2 的月活跃玩家为 ${fmt(latest.mau)}。Valve 每月 1 日 07:00 UTC 发布一次。`,
  },
  {
    question: '历史最高玩家数是多少？',
    answer: `历史峰值为 ${fmt(peak.mau)} 名月活跃玩家（${zhMonthYear(peak.date)}）。CS:GO 在过渡到 CS2 之前的峰值为 ${fmt(csgoPeak.mau)}（${zhMonthYear(csgoPeak.date)}）。`,
  },
  {
    question: '数据从哪里来？',
    answer:
      '来自 counter-strike.net 所用的官方 Steam Web API，以及该 API 出现之前由 Wayback Machine 保存的网站历史快照。',
  },
  {
    question: '页面多久更新一次？',
    answer: '每月自动更新一次，在 Valve 发布新数据后不久。',
  },
]

function createMetadata(lang) {
  const isZh = lang === 'zh'
  const faq = isZh ? zhFaq : enFaq
  const yearMonth = isZh
    ? zhMonthYear(latest.date)
    : enMonthYear(latest.date)
  const title = isZh
    ? `CS2 玩家数：${fmtWan(latest.mau)}（${yearMonth}）`
    : `CS2 Player Count: ${fmtCompact(latest.mau)} Monthly Players (${yearMonth})`
  const description = isZh
    ? `CS2 月活跃玩家：${fmt(latest.mau)}（${yearMonth}）；历史峰值 ${fmt(peak.mau)}。查看自 2013 年 10 月起的 Counter-Strike 数据来源与完整历史。`
    : `CS2 MAU: ${fmt(latest.mau)} (${yearMonth}); all-time peak ${fmt(peak.mau)}. Monthly Counter-Strike player history since Oct 2013 from Steam API & Wayback Machine.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'CS MAU Tracker',
        alternateName: isZh ? 'CS 每月玩家追踪' : undefined,
        url: SITE,
        description,
        inLanguage: isZh ? 'zh-CN' : 'en-US',
      },
      {
        '@type': 'Dataset',
        name: isZh
          ? 'Counter-Strike 月活跃用户（MAU），2013-10 至今'
          : 'Counter-Strike Monthly Active Users (MAU), 2013-10 to present',
        description,
        url: isZh ? SITE_ZH : SITE,
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', name: 'CS MAU Tracker', url: SITE },
        license: `${REPO}/blob/master/LICENSE`,
        dateModified: latest.api_timestamp ?? latest.date,
        measurementTechnique:
          'Monthly deduplicated player counts from the official Steam Web API and historical counter-strike.net archives.',
        temporalCoverage: range,
        variableMeasured: {
          '@type': 'PropertyValue',
          name: 'Monthly Active Users (MAU)',
          unitText: 'players',
        },
        distribution: [
          {
            '@type': 'DataDownload',
            contentUrl: `${SITE}/data/all.json`,
            encodingFormat: 'application/json',
          },
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
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return { title, description, ogTitle: title, jsonLd }
}

// Patch each localized document between persistent markers so repeated runs
// remain idempotent and template prose stays editable outside this script.
const pages = [
  { lang: 'en', file: resolve(webDir, 'index.html') },
  { lang: 'zh', file: resolve(webDir, 'zh', 'index.html') },
]
for (const page of pages) {
  const originalHtml = readFileSync(page.file, 'utf-8')
  let html = originalHtml
  const meta = createMetadata(page.lang)
  const canonical = page.lang === 'zh' ? `${SITE}/zh/` : `${SITE}/`
  const blocks = [
    ['TITLE', `<title>${escapeHtml(meta.title)}</title>`],
    [
      'DESC',
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    ],
    ['CANONICAL', `<link rel="canonical" href="${canonical}" />`],
    [
      'OG_TITLE',
      `<meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />`,
    ],
    [
      'OG_DESC',
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    ],
    ['OG_URL', `<meta property="og:url" content="${canonical}" />`],
    [
      'TW_TITLE',
      `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle)}" />`,
    ],
    [
      'TW_DESC',
      `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    ],
    [
      'HREFLANG',
      [
        `<link rel="alternate" hreflang="en" href="${SITE}/" />`,
        `<link rel="alternate" hreflang="zh" href="${SITE_ZH}" />`,
        `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
      ].join('\n    '),
    ],
    [
      'JSONLD',
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)
        .replace(/</g, '\\u003c')
        .replace(/&/g, '\\u0026')}</script>`,
    ],
  ]

  for (const [name, content] of blocks) {
    const marker = new RegExp(
      `(<!-- SEO:${name} -->)[\\s\\S]*?(<!-- /SEO:${name} -->)`,
    )
    if (!marker.test(html)) {
      throw new Error(`[gen-seo] missing SEO:${name} in ${page.file}`)
    }
    html = html.replace(marker, `$1\n    ${content}\n    $2`)
  }
  if (html !== originalHtml) {
    writeFileSync(page.file, html)
    console.log(`[gen-seo] patched localized metadata in ${page.file}`)
  }
}

const writeIfChanged = (file, content) => {
  const existing = existsSync(file) ? readFileSync(file, 'utf-8') : null
  if (existing !== content) {
    writeFileSync(file, content)
    console.log(`[gen-seo] wrote ${file.replace(root, '')}`)
  }
}

writeIfChanged(
  resolve(publicDir, 'robots.txt'),
  [
    '# CS MAU Tracker - robots.txt (generated by scripts/gen-seo.mjs)',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE}/sitemap.xml`,
    '',
  ].join('\n'),
)

const lastmod = modifiedAt?.slice(0, 10) ?? latest.date
writeIfChanged(
  resolve(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
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
`,
)

mkdirSync(resolve(publicDir, 'data'), { recursive: true })
cpSync(dataDir, resolve(publicDir, 'data'), {
  recursive: true,
  filter: (source) => source !== dataDir && !source.includes('__pycache__'),
})

const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
writeIfChanged(
  resolve(publicDir, 'data', 'all.json'),
  `${JSON.stringify(merged, null, 2)}\n`,
)
console.log(`[gen-seo] wrote all.json with ${merged.length} merged records`)
