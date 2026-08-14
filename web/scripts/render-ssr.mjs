// Build-time prerender step (runs after `vite build`): renders the React app
// to static HTML with react-dom/server and injects it into dist/index.html,
// so search engines and no-JS users see the full content. The client bundle
// then hydrates the same markup (see src/main.tsx).
//
// The SSR bundle is built with Vite's own build API into a temp dir, imported,
// and discarded — no extra dependencies.
import { build } from 'vite'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const webDir = resolve(import.meta.dirname, '..')
const cacheDir = resolve(webDir, 'node_modules', '.cache', 'ssr-render')

try {
  await build({
    root: webDir,
    configFile: resolve(webDir, 'vite.config.ts'),
    logLevel: 'warn',
    build: {
      ssr: resolve(webDir, 'src', 'ssr-entry.tsx'),
      outDir: cacheDir,
      emptyOutDir: true,
      rollupOptions: {
        output: { entryFileNames: 'ssr-entry.js' },
      },
    },
  })

  const { renderApp } = await import(resolve(cacheDir, 'ssr-entry.js'))
  const html = renderApp()

  const distIndex = resolve(webDir, 'dist', 'index.html')
  const template = readFileSync(distIndex, 'utf-8')
  const marker = '<div id="app"></div>'
  if (!template.includes(marker)) {
    throw new Error('Could not find the #app mount node in dist/index.html')
  }
  const patched = template.replace(marker, `<div id="app">${html}</div>`)
  writeFileSync(distIndex, patched)
  console.log(
    `[render-ssr] injected ${html.length} chars of prerendered HTML into dist/index.html`,
  )
} finally {
  rmSync(cacheDir, { recursive: true, force: true })
}
