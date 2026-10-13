import { useEffect, useState } from 'react'
import type { Lang } from '../lib/i18n'
import { I18nProvider } from '../lib/i18n'
import { cards, findCard } from './registry'
import type { LabQuery } from './types'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
]

/** Read lab state from the URL so any card view can be bookmarked or shared. */
export function readLabQuery(): LabQuery {
  const params = new URLSearchParams(window.location.search)
  return {
    v: findCard(params.get('v')).slug,
    lang: params.get('lang') === 'zh' ? 'zh' : 'en',
  }
}

export default function LabApp({ initial }: { initial: LabQuery }) {
  const [slug, setSlug] = useState(initial.v)
  const [lang, setLang] = useState(initial.lang)

  const card = findCard(slug)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    const params = new URLSearchParams({ v: slug, lang })
    window.history.replaceState(null, '', `?${params}`)
  }, [slug, lang])

  function toggleLanguage() {
    setLang((current) => (current === 'en' ? 'zh' : 'en'))
  }

  const { Component } = card

  return (
    <>
      {/* A card is a whole page and renders as one, with nothing of the lab
          around it. `key` remounts the tree on a language change because
          I18nProvider takes its language once, at mount. */}
      <I18nProvider key={lang} initialLang={lang}>
        <Component onLanguageToggle={toggleLanguage} />
      </I18nProvider>

      {/* Floating so it never takes space away from the card's own layout. */}
      <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-steam-nav/95 px-3 py-2 text-steam-text shadow-steam-lg ring-1 ring-steam-border">
        <select
          value={slug}
          aria-label="风格卡"
          onChange={(event) => setSlug(event.target.value)}
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
            onClick={() => setLang(value)}
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
