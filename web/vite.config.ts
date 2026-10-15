import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

/**
 * The chart is behind `lazy()`, so its chunks are not requested until the
 * entry chunk has downloaded, executed and mounted — a whole round trip before
 * their own download even starts, on a link where a round trip is seconds. It
 * is the page's main content, so the document asks for it up front and the two
 * travel together.
 *
 * Both chunks are listed, not just the big one: `ChartSection` is the wrapper
 * that decides whether there is enough data to draw at all, and a 650-byte
 * file behind a full round trip costs as much as a 185 kB one. The filenames
 * carry hashes, so they are read off the bundle rather than written out here.
 */
function preloadChartChunks(): Plugin {
  const names = ['ChartSection', 'MAUChart']

  return {
    name: 'preload-chart-chunks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = Object.values(ctx.bundle ?? {})
        return names.flatMap((name) => {
          const chunk = bundle.find(
            (output) =>
              output.type === 'chunk' &&
              output.fileName.split('/').pop()!.startsWith(`${name}-`),
          )
          if (!chunk) return []
          return [
            {
              tag: 'link',
              attrs: {
                rel: 'modulepreload',
                // Must match the module script's, or the browser fetches twice.
                crossorigin: '',
                href: `/${chunk.fileName}`,
              },
              injectTo: 'head-prepend' as const,
            },
          ]
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), preloadChartChunks()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        zh: resolve(__dirname, 'zh/index.html'),
      },
    },
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
  },
})
