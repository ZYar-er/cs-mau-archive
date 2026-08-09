import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'zh'

const en = {
  subtitle: 'Counter-Strike Monthly Players',
  githubAria: 'GitHub repository',
  heroTitle: 'Monthly Players',
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
  latest: 'Latest',
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
  noData: 'No data available',
  syncHint: 'Run {cmd} to sync data files.',
  notEnough: 'Not enough data yet',
  chartHint: 'Chart will appear once more data points are collected.',
  dataSource: 'Data via Steam Web API & Wayback Machine · Updated monthly',
  copyright: 'CS MAU Tracker © {year}',
} as const

export type TKey = keyof typeof en

const zh: Record<TKey, string> = {
  subtitle: '反恐精英每月玩家数',
  githubAria: 'GitHub 仓库',
  heroTitle: '每月玩家数',
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
  latest: '最新',
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
  eventCs2Ann: 'CS2 官宣',
  eventCs2: 'CS2',
  noData: '暂无数据',
  syncHint: '运行 {cmd} 同步数据文件。',
  notEnough: '数据不足',
  chartHint: '收集到更多数据后图表将显示。',
  dataSource: '数据来源：Steam Web API 与 Wayback Machine · 每月更新',
  copyright: 'CS MAU Tracker © {year}',
}

const dictionaries: Record<Lang, Record<TKey, string>> = { en, zh }

export type Translator = (key: TKey) => string

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translator
  locale: string
}

const STORAGE_KEY = 'cs-mau-lang'

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') return saved
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const t = useCallback<Translator>((key) => dictionaries[lang][key], [lang])

  return (
    <I18nContext.Provider
      value={{ lang, setLang, t, locale: lang === 'zh' ? 'zh-CN' : 'en-US' }}
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
