import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function studioGeneratePlugin(): Plugin {
  return {
    name: 'studio-generate-output',
    configureServer(server) {
      server.middlewares.use('/__studio/write-output', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const chunks: Uint8Array[] = []
        req.on('data', (chunk: Uint8Array) => {
          chunks.push(chunk)
        })
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8')
            const body = JSON.parse(raw) as {
              slug?: string
              files?: Record<string, string>
            }
            if (!body.slug || !body.files) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid body' }))
              return
            }

            const safeSlug = body.slug.replace(/[^a-z0-9-]/gi, '').slice(0, 64)
            if (!safeSlug) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid slug' }))
              return
            }

            const outDir = path.resolve(server.config.root, 'docs/studio-output')
            fs.mkdirSync(outDir, { recursive: true })

            const written: string[] = []
            for (const [name, content] of Object.entries(body.files)) {
              if (!/^[a-z0-9._-]+\.(ts|json)$/i.test(name)) continue
              if (!name.includes(safeSlug)) continue
              const target = path.join(outDir, name)
              if (!target.startsWith(outDir)) continue
              fs.writeFileSync(target, content, 'utf8')
              written.push(path.relative(server.config.root, target))
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, written }))
          } catch (error) {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'Write failed',
              }),
            )
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), studioGeneratePlugin()],
})
