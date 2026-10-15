import { useEffect } from 'react'
import { I18nProvider, useI18n, type Lang } from '../lib/i18n'
import { cards, findCard } from '../styles/registry'
import { useStyleSelection } from '../styles/useStyleSelection'

export interface LabQuery {
  /** Card slug. */
  v: string
  lang: Lang
}

/** Read lab state from the URL so any card view can be bookmarked or shared. */
export function readLabQuery(): LabQuery {
  const params = new URLSearchParams(window.location.search)
  return {
    v: findCard(params.get('v')).slug,
    lang: params.get('lang') === 'zh' ? 'zh' : 'en',
  }
}

/**
 * The lab's address shape, which differs from the site's on purpose: this page
 * is one dev-only document, so both halves live in the query string. The site
 * keeps the language in the path — see src/SiteRoot.tsx.
 */
function labHref(lang: Lang, slug: string): string {
  return `?${new URLSearchParams({ v: slug, lang })}`
}

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
]

/**
 * The dev harness around a card: the card itself, plus the floating switcher
 * the site does not have. On the site the same selection is driven by the
 * header's style control instead — see src/SiteRoot.tsx.
 */
function LabShell({ initial }: { initial: LabQuery }) {
  const { card, styleSwitch, onLanguageToggle, select, setLanguage } =
    useStyleSelection({ initialStyle: initial.v, href: labHref })
  const { lang } = useI18n()

  // web/lab/index.html is written as `lang="en"`. The provider keeps the
  // document honest when the language is switched, but not when it is seeded,
  // so a `?lang=zh` link has to correct it here.
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const { Component } = card

  return (
    <>
      <Component onLanguageToggle={onLanguageToggle} styleSwitch={styleSwitch} />

      {/* Floating so it never takes space away from the card's own layout.
          Listing every card by name is the point: it beats the header's
          control, which can only walk the registry one step at a time. */}
      <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-steam-nav/95 px-3 py-2 text-steam-text shadow-steam-lg ring-1 ring-steam-border">
        <select
          value={card.slug}
          aria-label="风格卡"
          onChange={(event) => select(event.target.value)}
          className="rounded border border-steam-border bg-steam-bg px-2 py-1 text-sm"
        >
          {cards.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.title}
            </option>
          ))}
        </select>

        {LANGS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={lang === value}
            onClick={() => setLanguage(value)}
            className={`rounded px-2 py-1 text-sm ${
              lang === value
                ? 'bg-steam-blue font-medium text-steam-nav'
                : 'hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}

        <span className="w-full text-xs text-steam-muted sm:w-auto">
          {card.note}
        </span>
      </div>
    </>
  )
}

export default function LabApp({ initial }: { initial: LabQuery }) {
  return (
    <I18nProvider initialLang={initial.lang}>
      <LabShell initial={initial} />
    </I18nProvider>
  )
}
