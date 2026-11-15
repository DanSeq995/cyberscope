import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // I polyfill Node servono solo allo SDK Webex (chat di squadra), che è scritto per Node/browserify ed è
  // caricato con import dinamico in un chunk separato.
  plugins: [react(), tailwindcss(), nodePolyfills({ globals: { global: true, process: true, Buffer: true } })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5190,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 5190,
    host: true,
    strictPort: true,
  },
})