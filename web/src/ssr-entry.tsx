// Server-side rendering entry, used only by scripts/render-ssr.mjs at build
// time to prerender the app shell into dist/index.html. Not part of the
// client bundle (nothing imports it from the app graph).
import { renderToString } from 'react-dom/server'
import { I18nProvider } from './lib/i18n'
import App from './App'

export function renderApp(): string {
  return renderToString(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}
