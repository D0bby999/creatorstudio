import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

export default defineConfig(async () => {
  const plugins: (Plugin | false)[] = [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths({ ignoreConfigErrors: true }),
  ]

  if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(
      visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }) as Plugin
    )
  }

  return {
    plugins,
    server: { port: 5173 },
  }
})
