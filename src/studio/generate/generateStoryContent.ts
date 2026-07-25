import type { StoryContentBlock, StoryImage } from '../../data/story-details'
import type { StoryPreview } from '../../data/stories'
import type { LocalizedText } from '../../i18n/types'
import type { MediaAsset } from '../media/types'
import type { StudioBlock, StudioDraft, StudioImage as StudioImg } from '../types'
import { slugifyTitle } from './slugify'
import { validateDraft, type DraftWarning } from './validateDraft'

export type GeneratedStoryPreview = Omit<StoryPreview, 'route'> & {
  route?: string
}

export type GeneratedImageMeta = {
  assetId?: string
  src: string
  width?: number
  height?: number
  publishedName?: string
}

export type GeneratedStoryOutput = {
  slug: string
  generatedAt: string
  preview: GeneratedStoryPreview
  blocks: StoryContentBlock[]
  imageMeta: GeneratedImageMeta[]
  warnings: DraftWarning[]
}

function localizeOrEn(value: LocalizedText | undefined, fallback = ''): LocalizedText | undefined {
  if (!value) return fallback ? { en: fallback } : undefined
  const en = value.en?.trim() ?? ''
  if (!en && !value.ru?.trim()) return undefined
  return value.ru?.trim() ? { en: en || value.ru, ru: value.ru } : { en }
}

function publicSrcForImage(image: StudioImg, assets: Map<string, MediaAsset>): string {
  if (image.assetId) {
    const asset = assets.get(image.assetId)
    if (asset?.publishedName) {
      return `/images/stories/${asset.publishedName}`
    }
  }
  if (image.src.startsWith('/')) return image.src
  if (image.src.startsWith('blob:') || image.src.startsWith('placeholder:') || image.src.startsWith('asset:')) {
    return ''
  }
  return image.src
}

function toStoryImage(image: StudioImg, assets: Map<string, MediaAsset>): StoryImage | null {
  const src = publicSrcForImage(image, assets)
  if (!src) return null

  const result: StoryImage = { src }
  const alt = localizeOrEn(image.alt)
  const caption = localizeOrEn(image.caption)
  if (alt) result.alt = alt
  if (caption) result.caption = caption
  if (image.orientation) result.orientation = image.orientation
  return result
}

function parseKicker(kicker: string): { date: string; location: LocalizedText } {
  const parts = kicker.split('·').map((part) => part.trim()).filter(Boolean)
  let date = new Date().toISOString().slice(0, 10)
  let locationEn = 'Georgia'

  if (parts.length >= 2) {
    locationEn = parts[parts.length - 1] ?? locationEn
    const monthYear = parts[0] ?? ''
    const match = monthYear.match(/^([A-Za-z]+)\s+(\d{4})$/)
    if (match) {
      const months: Record<string, string> = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
      }
      const month = months[match[1].toLowerCase()]
      if (month) date = `${match[2]}-${month}-01`
    }
  } else if (parts.length === 1) {
    locationEn = parts[0]
  }

  return { date, location: { en: locationEn } }
}

function countPhotos(blocks: StoryContentBlock[]): number {
  let count = 0
  for (const block of blocks) {
    if (block.type === 'image') count += 1
    if (block.type === 'image-row') count += block.images.length
  }
  return count
}

function convertBlock(
  block: StudioBlock,
  assets: Map<string, MediaAsset>,
): StoryContentBlock[] {
  if (block.type === 'text') {
    const content = localizeOrEn(block.content)
    if (!content) return []
    return [{ type: 'text', content }]
  }

  if (block.type === 'caption') {
    const content = localizeOrEn(block.content)
    if (!content) return []
    return [{ type: 'caption', content }]
  }

  if (block.type === 'location') {
    const label = localizeOrEn(block.label)
    if (!label) return []
    const coordinates = localizeOrEn(block.coordinates)
    return coordinates
      ? [{ type: 'location', label, coordinates }]
      : [{ type: 'location', label }]
  }

  if (block.type === 'image') {
    const image = toStoryImage(block.image, assets)
    if (!image) return []
    if (!block.showCaption) {
      const { caption: _c, ...withoutCaption } = image
      return [{ type: 'image', size: block.size, image: withoutCaption }]
    }
    return [{ type: 'image', size: block.size, image }]
  }

  if (block.type === 'image-row') {
    const left = toStoryImage(block.images[0], assets)
    const right = toStoryImage(block.images[1], assets)
    if (!left || !right) return []
    const images: [StoryImage, StoryImage] = block.showCaption
      ? [left, right]
      : [
          (() => {
            const { caption: _c, ...rest } = left
            return rest
          })(),
          (() => {
            const { caption: _c, ...rest } = right
            return rest
          })(),
        ]
    return [
      {
        type: 'image-row',
        layout: block.layout,
        images,
      },
    ]
  }

  if (block.type === 'image-triple') {
    const size = block.layout === 'thirds-portrait' ? 'portrait' : 'medium'
    return block.images.flatMap((image) => {
      const storyImage = toStoryImage(image, assets)
      if (!storyImage) return []
      const cleaned = block.showCaption
        ? storyImage
        : (() => {
            const { caption: _c, ...rest } = storyImage
            return rest
          })()
      return [{ type: 'image' as const, size, image: cleaned }]
    })
  }

  return []
}

function collectImageMeta(
  draft: StudioDraft,
  assets: Map<string, MediaAsset>,
): GeneratedImageMeta[] {
  const meta: GeneratedImageMeta[] = []
  const seen = new Set<string>()

  function push(image: StudioImg) {
    const src = publicSrcForImage(image, assets)
    const key = image.assetId ?? src
    if (!key || seen.has(key)) return
    seen.add(key)
    const asset = image.assetId ? assets.get(image.assetId) : undefined
    meta.push({
      assetId: image.assetId,
      src: src || image.src,
      width: image.width ?? asset?.width,
      height: image.height ?? asset?.height,
      publishedName: asset?.publishedName,
    })
  }

  for (const block of draft.blocks) {
    if (block.type === 'image') push(block.image)
    if (block.type === 'image-row' || block.type === 'image-triple') {
      block.images.forEach(push)
    }
  }

  return meta
}

export function generateStoryContent(
  draft: StudioDraft,
  assets: MediaAsset[],
): GeneratedStoryOutput {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]))
  const warnings = validateDraft(draft, assets)
  const blocks = draft.blocks.flatMap((block) => convertBlock(block, assetMap))
  const slug = slugifyTitle(draft.title)
  const { date, location } = parseKicker(draft.kicker)
  const imageMeta = collectImageMeta(draft, assetMap)

  const coverMeta = imageMeta.find((item) => item.src.startsWith('/')) ?? imageMeta[0]
  const detailMeta = imageMeta.find((item) => item.src !== coverMeta?.src && item.src.startsWith('/'))

  const title: LocalizedText = { en: draft.title.trim() || 'Untitled Story' }
  const description: LocalizedText = { en: draft.intro.trim() || '' }

  const preview: GeneratedStoryPreview = {
    id: slug,
    coverImage: coverMeta?.src || '',
    coverAlt: { en: title.en },
    title,
    location,
    date,
    description,
    intro: description.en ? description : undefined,
    photoCount: countPhotos(blocks),
    route: `/stories/${slug}`,
  }

  if (detailMeta?.src) {
    preview.detailImage = detailMeta.src
    preview.detailAlt = { en: detailMeta.src }
  }

  // Prefer first block image alt for cover when available
  for (const block of blocks) {
    if (block.type === 'image' && block.image.src === preview.coverImage && block.image.alt) {
      preview.coverAlt = block.image.alt
      break
    }
    if (block.type === 'image-row') {
      const match = block.images.find((image) => image.src === preview.coverImage)
      if (match?.alt) {
        preview.coverAlt = match.alt
        break
      }
    }
  }

  return {
    slug,
    generatedAt: new Date().toISOString(),
    preview,
    blocks,
    imageMeta,
    warnings,
  }
}
