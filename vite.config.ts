import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@lark-apaas/coding-preset-vite-react'
import { qwenDevPlugin } from './scripts/qwen-dev-plugin.mjs'

// The preset's offline target rewrites BrowserRouter to HashRouter.
// This project is a root-hosted web SPA, not a file:// export.
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const config = defineConfig({
  base: '/',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@shared': path.resolve(rootDir, 'shared'),
    },
  },
})

// Check after the preset has also loaded any .env files.
if (process.env.MIAODA_BUILD_TARGET === 'standalone') {
  throw new Error('Do not set MIAODA_BUILD_TARGET=standalone: this deployment must retain BrowserRouter.')
}

// Keep the existing React/Tailwind toolchain; remove only platform integration.
// Never edit node_modules: these exclusions apply to dev and production builds.
const platformPlugins = new Set([
  'miaoda-view-context',
  'miaoda-og-meta',
  'miaoda-slardar',
  'fullstack-basename-injection',
  'nestjs-vite-react-basename',
  'miaoda-dev-logs',
])
config.plugins = config.plugins?.filter((plugin) =>
  !plugin || !('name' in plugin) || !platformPlugins.has(plugin.name),
)

// Explicit public allow-list: even the legacy VITE_QWEN_API_KEY is SERVER ONLY.
config.envPrefix = ['VITE_TAXSHIELD_PUBLIC_']
config.plugins = [...(config.plugins || []), qwenDevPlugin()]

export default config
