import type { Lang } from './lib/i18n'
import { I18nProvider } from './lib/i18n'
import { DEFAULT_SLUG } from './styles/registry'
import { useStyleSelection } from './styles/useStyleSelection'

/**
 * The shipping site's address for a (language, style) pair: the language is
 * the path — two documents are prerendered, one per language, for no-JS
 * visitors and search engines — and the style rides in the query. The default
 * style leaves the query off, so the canonical address stays bare.
 */
function href(lang: Lang, slug: string): string {
  const path = lang === 'zh' ? '/zh/' : '/'
  return slug === DEFAULT_SLUG ? path : `${path}?v=${slug}`
}

function StylePage({ initialStyle }: { initialStyle: string }) {
  const { card, styleSwitch, onLanguageToggle } = useStyleSelection({
    initialStyle,
    href,
  })
  const { Component } = card

  return (
    <Component onLanguageToggle={onLanguageToggle} styleSwitch={styleSwitch} />
  )
}

interface Props {
  /**
   * The prerendered documents declare their language; the client reads the
   * same value back off <html lang>. Omitting it lets the provider sniff.
   */
  lang?: Lang
  /**
   * The style the URL asked for. Defaults to the shipping style, which is the
   * only one prerendered — see scripts/render-ssr.mjs and src/main.tsx.
   */
  initialStyle?: string
}

export default function SiteRoot({
  lang,
  initialStyle = DEFAULT_SLUG,
}: Props) {
  return (
    <I18nProvider initialLang={lang}>
      <StylePage initialStyle={initialStyle} />
    </I18nProvider>
  )
}
