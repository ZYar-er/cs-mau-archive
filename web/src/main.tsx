import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import SiteRoot from './SiteRoot'
import { DEFAULT_SLUG, findCard } from './styles/registry'

// Migrate the former query-based language switch to canonical localized paths.
if (typeof window !== 'undefined') {
  const requestedLang = new URLSearchParams(window.location.search).get('lang')
  const isZhPath = window.location.pathname === '/zh/'
  if (requestedLang === 'zh' && !isZhPath) {
    window.location.replace('/zh/')
  } else if (requestedLang === 'en' && isZhPath) {
    window.location.replace('/')
  }
}

const container = document.getElementById('app')!
// Resolved here rather than in the app so the first render already knows which
// card it is; see the hydration branch below.
const requestedStyle = findCard(
  new URLSearchParams(window.location.search).get('v'),
).slug

const tree = (
  <StrictMode>
    <SiteRoot initialStyle={requestedStyle} />
  </StrictMode>
)

// Only the shipping style was prerendered (scripts/render-ssr.mjs), so it is
// the only one with markup to hydrate. A link to another style — or plain
// `vite dev`, which has no prerender at all — takes the container over
// instead, rather than painting the shipping style and swapping a frame later.
if (container.childElementCount > 0 && requestedStyle === DEFAULT_SLUG) {
  hydrateRoot(container, tree)
} else {
  container.replaceChildren()
  createRoot(container).render(tree)
}
