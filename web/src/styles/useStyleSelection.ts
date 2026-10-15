import { useCallback, useState } from 'react'
import type { StyleSwitch } from '../components/Header'
import { useI18n, type Lang } from '../lib/i18n'
import { findCard, nextCard } from './registry'
import type { StyleCard } from './types'

interface Options {
  /**
   * The style the URL already asked for. The hook never reads `location`
   * itself: each host owns the shape of its own URL, and a host that resolved
   * the query during render would change its first client render out from
   * under the prerendered markup.
   */
  initialStyle: string
  /**
   * The address for a (language, style) pair, as this host spells it. The
   * shipping pages put the language in the path and the style in `?v=`; the
   * lab keeps both in its query string.
   */
  href: (lang: Lang, slug: string) => string
}

export interface StyleSelection {
  /** The card to render. */
  card: StyleCard
  /** The card the header's style control leads to, ready to hand to it. */
  styleSwitch: StyleSwitch
  /** The header's language control. */
  onLanguageToggle: () => void
  /** Jump to a named style — the lab's switcher uses this. */
  select: (slug: string) => void
  /** Jump to a named language — the lab's switcher uses this. */
  setLanguage: (lang: Lang) => void
}

/**
 * The selection both hosts share: which card is on screen, which language it
 * is in, and the two controls the header renders for them.
 *
 * Call it inside `I18nProvider` — the language lives there, so a switch is an
 * in-place re-render rather than a remount, which leaves the chart's zoom and
 * range alone.
 */
export function useStyleSelection({
  initialStyle,
  href,
}: Options): StyleSelection {
  const { lang, setLang } = useI18n()
  const [slug, setSlug] = useState(() => findCard(initialStyle).slug)

  const select = useCallback(
    (next: string) => {
      const resolved = findCard(next).slug
      window.history.replaceState(null, '', href(lang, resolved))
      setSlug(resolved)
    },
    [href, lang],
  )

  // Language is carried across by `href` rather than dropped: switching to
  // Chinese while on a style keeps both halves of the address.
  const setLanguage = useCallback(
    (next: Lang) => {
      window.history.replaceState(null, '', href(next, slug))
      setLang(next)
    },
    [href, slug, setLang],
  )

  const onLanguageToggle = useCallback(
    () => setLanguage(lang === 'en' ? 'zh' : 'en'),
    [lang, setLanguage],
  )

  const next = nextCard(slug)

  return {
    card: findCard(slug),
    styleSwitch: {
      title: next.title,
      href: href(lang, next.slug),
      onSelect: () => select(next.slug),
    },
    onLanguageToggle,
    select,
    setLanguage,
  }
}
