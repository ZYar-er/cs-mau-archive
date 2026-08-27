// Build-time prerender step (runs after `vite build`): renders the React app
// to static HTML with react-dom/server and injects it into localized documents,
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
  for (const page of [
    { lang: 'en', file: resolve(webDir, 'dist', 'index.html') },
    { lang: 'zh', file: resolve(webDir, 'dist', 'zh', 'index.html') },
  ]) {
    const html = renderApp(page.lang)
    const template = readFileSync(page.file, 'utf-8')
    const marker = '<div id="app"></div>'
    if (!template.includes(marker)) {
      throw new Error(`Could not find #app mount node in ${page.file}`)
    }
    const patched = template.replace(marker, `<div id="app">${html}</div>`)
    writeFileSync(page.file, patched)
    console.log(
      `[render-ssr] injected ${html.length} chars into ${page.file.replace(webDir, '')}`,
    )
  }
} finally {
  rmSync(cacheDir, { recursive: true, force: true })
}
