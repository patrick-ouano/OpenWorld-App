import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Read `PORT` from `server/.env` only (do not load that file into `process.env` — it would clash with Vite). */
function backendPortFromServerEnv() {
  const envPath = path.resolve(__dirname, '../server/.env')
  try {
    const raw = fs.readFileSync(envPath, 'utf8')
    const line = raw.split(/\r?\n/).find((l) => /^PORT\s*=/i.test(l))
    if (!line) return 5000
    const value = line.replace(/^PORT\s*=\s*/i, '').trim().replace(/^["']|["']$/g, '')
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : 5000
  } catch {
    return 5000
  }
}

const backendPort = backendPortFromServerEnv()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
