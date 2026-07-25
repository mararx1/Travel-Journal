import type { MediaAsset } from '../media/types'
import type { LocalizedText } from '../../i18n/types'
import type { StudioBlock, StudioDraft, StudioImage } from '../types'
import { resolveStorySlug } from './slugify'

export type DraftWarning = {
  id: string
  message: string
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value.trim())
}

function missingRu(value: LocalizedText | undefined, label: string): DraftWarning | null {
  if (!value || !hasText(value.en)) return null
  if (hasText(value.ru)) return null
  return { id: `ru:${label}`, message: `Missing Russian translation: ${label}` }
}

function collectImages(blocks: StudioBlock[]): StudioImage[] {
  const images: StudioImage[] = []
  for (const block of blocks) {
    if (block.type === 'image') images.push(block.image)
    if (block.type === 'image-row' || block.type === 'image-triple') {
      images.push(...block.images)
    }
  }
  return images
}

function isPlaceholder(image: StudioImage): boolean {
  return Boolean(
    image.placeholder
    || image.src.startsWith('placeholder:')
    || image.src.startsWith('asset:'),
  )
}

function looksLikeVideoUrl(value: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?)/i.test(value)
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateDraft(
  draft: StudioDraft,
  assets: MediaAsset[],
): DraftWarning[] {
  const warnings: DraftWarning[] = []
  const assetById = new Map(assets.map((asset) => [asset.id, asset]))
  const images = collectImages(draft.blocks)
  const usableCovers = images.filter((image) => !isPlaceholder(image))

  if (!hasText(draft.title) || draft.title.trim() === 'Untitled Story') {
    warnings.push({ id: 'title', message: 'Missing title' })
  } else {
    warnings.push({
      id: 'ru:title',
      message: 'Missing Russian translation: story title',
    })
  }

  if (usableCovers.length === 0) {
    warnings.push({ id: 'cover', message: 'Missing cover image' })
  }

  if (!hasText(draft.intro)) {
    warnings.push({ id: 'description', message: 'Missing description / intro' })
  }

  const slugResult = resolveStorySlug(draft.title)
  if (slugResult.collisionAdjusted) {
    warnings.push({
      id: 'slug-collision',
      message: `Slug adjusted to “${slugResult.slug}” to avoid collision with an existing story`,
    })
  }

  for (const block of draft.blocks) {
    if (block.type === 'text') {
      const warning = missingRu(block.content, `text block (${block.id})`)
      if (warning) warnings.push(warning)
      if (!hasText(block.content.en)) {
        warnings.push({ id: `empty-text:${block.id}`, message: `Empty text block (${block.id})` })
      }
      if (looksLikeVideoUrl(block.content.en) && !isValidHttpUrl(block.content.en.trim())) {
        warnings.push({
          id: `video:${block.id}`,
          message: `Invalid video URL in text block (${block.id})`,
        })
      }
    }

    if (block.type === 'caption') {
      const warning = missingRu(block.content, `caption block (${block.id})`)
      if (warning) warnings.push(warning)
    }

    if (block.type === 'location') {
      const labelWarning = missingRu(block.label, `location label (${block.id})`)
      if (labelWarning) warnings.push(labelWarning)
      const coordsWarning = missingRu(block.coordinates, `location coordinates (${block.id})`)
      if (coordsWarning) warnings.push(coordsWarning)
    }

    if (block.type === 'image-triple') {
      warnings.push({
        id: `triple:${block.id}`,
        message: `Three-photo row (${block.id}) is not a public Story block type; it will export as three single images`,
      })
    }
  }

  for (const image of images) {
    if (image.alt) {
      const warning = missingRu(image.alt, `alt “${image.alt.en.slice(0, 40)}”`)
      if (warning) warnings.push(warning)
    }
    if (image.caption) {
      const warning = missingRu(image.caption, `caption “${image.caption.en.slice(0, 40)}”`)
      if (warning) warnings.push(warning)
    }

    if (isPlaceholder(image)) {
      warnings.push({
        id: `placeholder:${image.assetId ?? image.src}`,
        message: 'Unused or empty image slot in the story',
      })
      continue
    }

    if (image.assetId) {
      const asset = assetById.get(image.assetId)
      if (!asset) {
        warnings.push({
          id: `broken:${image.assetId}`,
          message: `Broken asset reference (${image.assetId})`,
        })
      } else if (asset.status === 'missing') {
        warnings.push({
          id: `missing-file:${asset.id}`,
          message: `Missing image file: ${asset.name}`,
        })
      } else if (!asset.publishedName && image.src.startsWith('blob:')) {
        warnings.push({
          id: `unpublished:${asset.id}`,
          message: `Asset used on canvas has no publication derivative yet: ${asset.name}`,
        })
      }
    }
  }

  // Deduplicate by id while preserving order
  const seen = new Set<string>()
  return warnings.filter((warning) => {
    if (seen.has(warning.id)) return false
    seen.add(warning.id)
    return true
  })
}
