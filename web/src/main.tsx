import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { I18nProvider } from './lib/i18n'

const container = document.getElementById('app')!
const tree = (
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)

if (container.childElementCount > 0) {
  // dist/index.html was prerendered at build time (scripts/render-ssr.mjs) —
  // hydrate it. In plain `vite dev` there is no prerendered markup, so we
  // render client-side instead.
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
