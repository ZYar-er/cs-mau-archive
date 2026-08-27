import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'zh'

const en = {
  subtitle: 'Counter-Strike Monthly Players',
  githubAria: 'GitHub repository',
  heroTitle: 'CS2 Monthly Players',
  asOf: 'as of {date}',
  mom: 'MoM',
  yoy: 'YoY',
  game: 'Game',
  sourcePrefix: 'source: {source}',
  archive: 'Archive',
  recordsSub: 'records · {range}',
  apiUpdated: 'API Updated',
  peak: 'Peak',
  cs2Average: 'CS2 Average',
  cs2AverageSub: 'since {month}',
  csgoPeak: 'CS:GO Peak',
  cs2Peak: 'CS2 Peak',
  all: 'ALL',
  chartTitle: 'Monthly Players History',
  monthsUnit: 'mo',
  cs2Lowest: 'CS2 Lowest',
  average: 'Average',
  cs2Avg: 'CS2 Avg',
  mau: 'Monthly Players',
  avg6: '6-Month Avg',
  eventCsgo: 'CS:GO',
  eventF2p: 'F2P',
  eventCs2Ann: 'CS2 Ann.',
  eventCs2: 'CS2',
  switchToZh: 'Switch to Chinese',
  switchToEn: 'Switch to English',
  noData: 'No data available',
  syncHint: 'Run {cmd} to sync data files.',
  notEnough: 'Not enough data yet',
  chartHint: 'Chart will appear once more data points are collected.',
  dataSource: 'Data via Steam Web API & Wayback Machine · Updated monthly',
  copyright: 'CS MAU Tracker © {year}',
  aboutTitle: 'About This Data',
  methodTitle: 'Methodology',
  methodP1:
    'Monthly Active Users (MAU) counts the unique players who played Counter-Strike in the last month, as published by Valve through the official Steam Web API (ICSGOServers_730/GetMonthlyPlayerCount/v1) that powers counter-strike.net.',
  methodP2:
    'Years before that API existed are recovered from historical snapshots of counter-strike.net preserved in the Wayback Machine, then merged with API records and de-duplicated by month.',
  methodP3:
    'Valve publishes the figure on the 1st of each month at 07:00 UTC; this tracker refreshes automatically via GitHub Actions. The chart above covers {count} monthly records from {range}.',
  timelineTitle: 'Timeline',
  tCsgoLaunch: 'CS:GO launches',
  tF2p: 'CS:GO becomes free-to-play',
  tCs2Ann: 'CS2 is announced',
  tCs2Launch: 'CS2 launches and replaces CS:GO',
  tCsgoPeak: 'CS:GO peak — {mau} players ({month})',
  tAllPeak: 'All-time peak — {mau} players ({month})',
  tLatest: 'Latest record — {mau} players ({month})',
  faqTitle: 'FAQ',
  faq1q: 'How many people play CS2 right now?',
  faq1a:
    'As of {date}, Counter-Strike 2 had {mau} monthly active players. Valve publishes this figure once per month on the 1st at 07:00 UTC.',
  faq2q: 'What is the highest player count ever recorded?',
  faq2a:
    'The all-time peak is {peak} monthly active players, reached in {peakMonth}. CS:GO itself peaked at {csgoPeak} in {csgoPeakMonth} before the transition to CS2.',
  faq3q: 'Where does this data come from?',
  faq3a:
    'From the official Steam Web API used by counter-strike.net, plus Wayback Machine snapshots of that site for the years before the API existed.',
  faq4q: 'How often is this page updated?',
  faq4a:
    'Once a month, automatically, shortly after Valve publishes the new figure.',
} as const

export type TKey = keyof typeof en

const zh: Record<TKey, string> = {
  subtitle: '反恐精英每月玩家数',
  githubAria: 'GitHub 仓库',
  heroTitle: 'CS2 每月玩家数',
  asOf: '截至 {date}',
  mom: '环比',
  yoy: '同比',
  game: '游戏版本',
  sourcePrefix: '来源：{source}',
  archive: '存档',
  recordsSub: '记录 · {range}',
  apiUpdated: 'API 更新时间',
  peak: '峰值',
  cs2Average: 'CS2 平均值',
  cs2AverageSub: '自 {month} 起',
  csgoPeak: 'CS:GO 峰值',
  cs2Peak: 'CS2 峰值',
  all: 'ALL',
  chartTitle: '每月玩家数历史',
  monthsUnit: '个月',
  cs2Lowest: 'CS2 最低',
  average: '平均值',
  cs2Avg: 'CS2 均值',
  mau: '每月玩家数',
  avg6: '6 个月均值',
  eventCsgo: 'CS:GO',
  eventF2p: 'F2P',
  eventCs2Ann: 'CS2 公布',
  eventCs2: 'CS2',
  switchToZh: '切换为中文',
  switchToEn: '切换为英文',
  noData: '暂无数据',
  syncHint: '运行 {cmd} 同步数据文件。',
  notEnough: '数据不足',
  chartHint: '收集到更多数据后图表将显示。',
  dataSource: '数据来源：Steam Web API 与 Wayback Machine · 每月更新',
  copyright: 'CS MAU Tracker © {year}',
  aboutTitle: '关于数据',
  methodTitle: '数据口径',
  methodP1:
    '月活跃用户（MAU）统计最近一个月内玩过反恐精英的独立玩家数，由 Valve 通过官方 Steam Web API（ICSGOServers_730/GetMonthlyPlayerCount/v1，即 counter-strike.net 的数据源）发布。',
  methodP2:
    '该 API 出现之前的年份，由 Wayback Machine 保存的 counter-strike.net 历史快照恢复，再与 API 记录合并并按月份去重。',
  methodP3:
    'Valve 于每月 1 日 07:00 UTC 发布数据；本追踪器通过 GitHub Actions 自动更新。上图图表共覆盖 {count} 条月度记录（{range}）。',
  timelineTitle: '时间线',
  tCsgoLaunch: 'CS:GO 发布',
  tF2p: 'CS:GO 转为免费游戏',
  tCs2Ann: 'CS2 公布',
  tCs2Launch: 'CS2 上线并取代 CS:GO',
  tCsgoPeak: 'CS:GO 峰值 — {mau} 名玩家（{month}）',
  tAllPeak: '历史峰值 — {mau} 名玩家（{month}）',
  tLatest: '最新记录 — {mau} 名玩家（{month}）',
  faqTitle: '常见问题',
  faq1q: '现在有多少人在玩 CS2？',
  faq1a:
    '截至 {date}，Counter-Strike 2 的月活跃玩家为 {mau}。Valve 每月 1 日 07:00 UTC 发布一次。',
  faq2q: '历史最高玩家数是多少？',
  faq2a:
    '历史峰值为 {peak} 名月活跃玩家（{peakMonth}）。CS:GO 在过渡到 CS2 之前的峰值为 {csgoPeak}（{csgoPeakMonth}）。',
  faq3q: '数据从哪里来？',
  faq3a:
    '来自 counter-strike.net 所用的官方 Steam Web API，以及该 API 出现之前由 Wayback Machine 保存的网站历史快照。',
  faq4q: '页面多久更新一次？',
  faq4a: '每月自动更新一次，在 Valve 发布新数据后不久。',
}

const dictionaries: Record<Lang, Record<TKey, string>> = { en, zh }

export type Translator = (key: TKey) => string

interface I18nContextValue {
  lang: Lang
  t: Translator
  locale: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getDocumentLang(): Lang {
  return typeof document !== 'undefined' &&
    document.documentElement.lang.toLowerCase().startsWith('zh')
    ? 'zh'
    : 'en'
}

interface I18nProviderProps {
  children: ReactNode
  initialLang?: Lang
}

export function I18nProvider({ children, initialLang }: I18nProviderProps) {
  // Each localized document declares its language before hydration. Passing a
  // build-time initialLang keeps SSR and client hydration identical.
  const [lang] = useState<Lang>(
    () => initialLang ?? getDocumentLang(),
  )
  const getTranslation = dictionaries[lang]
  const t: Translator = (key) => getTranslation[key]

  return (
    <I18nContext.Provider
      value={{ lang, t, locale: lang === 'zh' ? 'zh-CN' : 'en-US' }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
