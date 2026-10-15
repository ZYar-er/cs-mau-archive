// Server-side rendering entry, used only by scripts/render-ssr.mjs at build
// time to prerender the app shell into dist/index.html. Not part of the
// client bundle (nothing imports it from the app graph).
import { renderToString } from 'react-dom/server'
import type { Lang } from './lib/i18n'
import SiteRoot from './SiteRoot'
import { DEFAULT_SLUG } from './styles/registry'

export function renderApp(lang: Lang = 'en'): string {
  return renderToString(<SiteRoot lang={lang} initialStyle={DEFAULT_SLUG} />)
}
