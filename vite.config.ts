import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const execFileAsync = promisify(execFile)

/** Hand-authored StoryPage content keys — Apply must never upsert these. */
const PROTECTED_CONTENT_SLUGS = new Set(['chiatura-caves'])

type AppliedStoryRecord = {
  preview: Record<string, unknown>
  blocks: unknown[]
}

type AppliedStoriesFile = {
  stories: Record<string, AppliedStoryRecord>
}

type ApplyImage = {
  fileName: string
  dataBase64: string
}

function collectImageFileNames(blocks: unknown[]): Set<string> {
  const names = new Set<string>()
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    const record = value as Record<string, unknown>
    if (typeof record.src === 'string') {
      const match = record.src.match(/\/images\/stories\/([^/?#]+)$/)
      if (match?.[1]) names.add(match[1])
    }
    for (const nested of Object.values(record)) visit(nested)
  }
  visit(blocks)
  return names
}

function readJsonBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    req.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

function studioGeneratePlugin(): Plugin {
  return {
    name: 'studio-generate-output',
    configureServer(server) {
      server.middlewares.use('/__studio/write-output', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        void readJsonBody(req).then((raw) => {
          try {
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

      server.middlewares.use('/__studio/apply-to-site', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        void (async () => {
          const root = server.config.root
          const appliedPath = path.resolve(root, 'src/data/applied-stories.json')
          const storiesDir = path.resolve(root, 'public/images/stories')

          let previousJson = ''
          const imageBackups = new Map<string, Buffer | null>()
          let wroteJson = false

          const respond = (status: number, body: Record<string, unknown>) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          const rollback = () => {
            if (previousJson) {
              fs.writeFileSync(appliedPath, previousJson, 'utf8')
            }
            for (const [fileName, backup] of imageBackups) {
              const target = path.join(storiesDir, fileName)
              if (backup === null) {
                if (fs.existsSync(target)) fs.unlinkSync(target)
              } else {
                fs.writeFileSync(target, backup)
              }
            }
          }

          try {
            const raw = await readJsonBody(req)
            const body = JSON.parse(raw) as {
              slug?: string
              preview?: Record<string, unknown>
              blocks?: unknown[]
              images?: ApplyImage[]
            }

            const safeSlug = (body.slug ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 64)
            if (!safeSlug || !body.preview || !Array.isArray(body.blocks)) {
              respond(400, { ok: false, error: 'Invalid apply body' })
              return
            }

            if (PROTECTED_CONTENT_SLUGS.has(safeSlug)) {
              respond(400, {
                ok: false,
                error: `Slug “${safeSlug}” is reserved for a hand-authored story`,
              })
              return
            }

            previousJson = fs.existsSync(appliedPath)
              ? fs.readFileSync(appliedPath, 'utf8')
              : `${JSON.stringify({ stories: {} }, null, 2)}\n`

            let data: AppliedStoriesFile
            try {
              data = JSON.parse(previousJson) as AppliedStoriesFile
            } catch {
              data = { stories: {} }
            }
            if (!data.stories || typeof data.stories !== 'object') {
              data = { stories: {} }
            }

            const previousEntry = data.stories[safeSlug]
            const previouslyOwned = previousEntry
              ? collectImageFileNames(previousEntry.blocks)
              : new Set<string>()

            fs.mkdirSync(storiesDir, { recursive: true })
            const written: string[] = []

            for (const image of body.images ?? []) {
              if (!image?.fileName || !image.dataBase64) continue
              if (!/^[a-z0-9._-]+\.(jpe?g|png|webp)$/i.test(image.fileName)) continue
              if (image.fileName.includes('..') || image.fileName.includes('/') || image.fileName.includes('\\')) {
                continue
              }

              const target = path.join(storiesDir, image.fileName)
              if (!target.startsWith(storiesDir)) continue

              const exists = fs.existsSync(target)
              if (exists && !previouslyOwned.has(image.fileName)) {
                // Do not overwrite unrelated/hand-authored assets.
                continue
              }

              imageBackups.set(
                image.fileName,
                exists ? fs.readFileSync(target) : null,
              )
              fs.writeFileSync(target, Buffer.from(image.dataBase64, 'base64'))
              written.push(path.relative(root, target))
            }

            data.stories[safeSlug] = {
              preview: {
                ...body.preview,
                id: safeSlug,
                route: `/stories/${safeSlug}`,
              },
              blocks: body.blocks,
            }

            const nextJson = `${JSON.stringify(data, null, 2)}\n`
            fs.writeFileSync(appliedPath, nextJson, 'utf8')
            wroteJson = true
            written.push(path.relative(root, appliedPath))

            let buildLog = ''
            try {
              const { stdout, stderr } = await execFileAsync(
                process.platform === 'win32' ? 'npm.cmd' : 'npm',
                ['run', 'build'],
                {
                  cwd: root,
                  maxBuffer: 8 * 1024 * 1024,
                  env: { ...process.env, FORCE_COLOR: '0' },
                },
              )
              buildLog = `${stdout}\n${stderr}`.trim()
            } catch (error) {
              const failed = error as {
                stdout?: string
                stderr?: string
                message?: string
              }
              buildLog = `${failed.stdout ?? ''}\n${failed.stderr ?? ''}\n${failed.message ?? ''}`.trim()
              rollback()
              respond(500, {
                ok: false,
                buildOk: false,
                error: 'Build failed after Apply — changes were rolled back',
                buildLog: buildLog.slice(-4000),
                written: [],
              })
              return
            }

            respond(200, {
              ok: true,
              buildOk: true,
              written,
              buildLog: buildLog.slice(-2000),
            })
          } catch (error) {
            if (wroteJson || imageBackups.size > 0) rollback()
            respond(500, {
              ok: false,
              error: error instanceof Error ? error.message : 'Apply failed',
            })
          }
        })()
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), studioGeneratePlugin()],
})
