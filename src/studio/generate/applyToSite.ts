import { measureAndDerive } from '../media/deriveImage'
import { readSourceFile } from '../fs/fsAccess'
import type { MediaAsset } from '../media/types'
import type { StudioDraft } from '../types'
import { getBlockingWarnings } from './blockingWarnings'
import { generateStoryContent, type GeneratedStoryOutput } from './generateStoryContent'

export type ApplyStatus =
  | { phase: 'idle' }
  | { phase: 'confirming' }
  | { phase: 'applying'; message: string }
  | { phase: 'build-passed'; message: string }
  | { phase: 'build-failed'; message: string }
  | { phase: 'error'; message: string }

export type ApplyToSiteResult =
  | { ok: true; slug: string; written: string[]; buildLog?: string }
  | { ok: false; error: string; buildLog?: string; cancelled?: boolean }

type ApplyImagePayload = {
  fileName: string
  dataBase64: string
}

/** Hand-authored StoryPage content keys that Apply must never overwrite. */
const PROTECTED_CONTENT_SLUGS = new Set(['chiatura-caves'])

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

async function collectImagesToCopy(
  output: GeneratedStoryOutput,
  assets: MediaAsset[],
): Promise<ApplyImagePayload[]> {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const images: ApplyImagePayload[] = []
  const seen = new Set<string>()

  for (const meta of output.imageMeta) {
    const fileName = meta.publishedName
    if (!fileName || seen.has(fileName) || !meta.assetId) continue

    const asset = assetById.get(meta.assetId)
    if (!asset || asset.status === 'missing') continue

    seen.add(fileName)

    try {
      const file = await readSourceFile(asset.sourceHandle)
      const derived = await measureAndDerive(file)
      images.push({
        fileName,
        dataBase64: await blobToBase64(derived.blob),
      })
    } catch {
      // Skip unreadable sources; validation/blocking warnings surface missing files.
    }
  }

  return images
}

function confirmApply(output: GeneratedStoryOutput): boolean {
  const blocking = getBlockingWarnings(output.warnings)
  const lines = [
    `Apply “${output.preview.title.en}” to the live site?`,
    `Slug: ${output.slug}`,
    '',
    'This upserts src/data/applied-stories.json, copies new images into public/images/stories/, then runs npm run build.',
    'Git commit/push stays manual.',
  ]

  if (blocking.length > 0) {
    lines.unshift(
      'Blocking issues — confirm to proceed anyway:',
      ...blocking.map((warning) => `• ${warning.message}`),
      '',
    )
  }

  return window.confirm(lines.join('\n'))
}

export async function applyToSite(
  draft: StudioDraft,
  assets: MediaAsset[],
  onStatus?: (status: ApplyStatus) => void,
): Promise<ApplyToSiteResult> {
  const output = generateStoryContent(draft, assets)

  if (PROTECTED_CONTENT_SLUGS.has(output.slug)) {
    return {
      ok: false,
      error: `Slug “${output.slug}” is reserved for a hand-authored story and cannot be applied.`,
    }
  }

  onStatus?.({ phase: 'confirming' })
  if (!confirmApply(output)) {
    return { ok: false, error: 'Apply cancelled', cancelled: true }
  }

  onStatus?.({ phase: 'applying', message: 'Applying…' })

  let images: ApplyImagePayload[] = []
  try {
    images = await collectImagesToCopy(output, assets)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not prepare images for Apply',
    }
  }

  try {
    const response = await fetch('/__studio/apply-to-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: output.slug,
        preview: output.preview,
        blocks: output.blocks,
        images,
      }),
    })

    const payload = (await response.json()) as {
      ok?: boolean
      error?: string
      written?: string[]
      buildOk?: boolean
      buildLog?: string
    }

    if (!response.ok || !payload.ok) {
      onStatus?.({
        phase: payload.buildOk === false ? 'build-failed' : 'error',
        message: payload.buildOk === false ? 'Build failed' : (payload.error ?? 'Apply failed'),
      })
      return {
        ok: false,
        error: payload.error ?? 'Apply failed',
        buildLog: payload.buildLog,
      }
    }

    if (payload.buildOk === false) {
      onStatus?.({ phase: 'build-failed', message: 'Build failed' })
      return {
        ok: false,
        error: payload.error ?? 'Build failed after Apply — changes were rolled back',
        buildLog: payload.buildLog,
      }
    }

    onStatus?.({ phase: 'build-passed', message: 'Build passed' })
    return {
      ok: true,
      slug: output.slug,
      written: payload.written ?? [],
      buildLog: payload.buildLog,
    }
  } catch {
    onStatus?.({
      phase: 'error',
      message: 'Apply endpoint unavailable (dev server required)',
    })
    return {
      ok: false,
      error: 'Apply endpoint unavailable. Run the Vite dev server to apply to the site.',
    }
  }
}
