import type { LocalizedText } from '../i18n/types'
import type {
  ImageRowLayout,
  ImageSize,
  ImageTripleLayout,
  StudioBlock,
  StudioDraft,
  StudioImage,
} from './types'

/** Current persisted draft document version. Bump when the shape changes incompatibly. */
export const DRAFT_SCHEMA_VERSION = 1 as const

/** Single-owner working draft key (no multi-draft UI in Phase 3). */
export const DEFAULT_DRAFT_ID = 'default'

/**
 * Serializable Studio draft envelope (JSON / IndexedDB).
 *
 * `draft` mirrors in-memory `StudioDraft`:
 * - title, kicker (date · location line), intro
 * - ordered blocks with type, layout presets, images, captions, EN/RU LocalizedText
 */
export type StudioDraftDocument = {
  schemaVersion: typeof DRAFT_SCHEMA_VERSION
  id: string
  updatedAt: string
  draft: StudioDraft
}

export function toDraftDocument(draft: StudioDraft, id = DEFAULT_DRAFT_ID): StudioDraftDocument {
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    id,
    updatedAt: new Date().toISOString(),
    draft,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!isRecord(value) || typeof value.en !== 'string') return false
  if (value.ru !== undefined && typeof value.ru !== 'string') return false
  return true
}

function isStudioImage(value: unknown): value is StudioImage {
  if (!isRecord(value) || typeof value.src !== 'string') return false
  if (value.assetId !== undefined && typeof value.assetId !== 'string') return false
  if (value.alt !== undefined && !isLocalizedText(value.alt)) return false
  if (value.caption !== undefined && !isLocalizedText(value.caption)) return false
  if (
    value.orientation !== undefined
    && value.orientation !== 'portrait'
    && value.orientation !== 'landscape'
    && value.orientation !== 'wide'
  ) {
    return false
  }
  if (value.placeholder !== undefined && typeof value.placeholder !== 'boolean') return false
  return true
}

const IMAGE_SIZES: ImageSize[] = ['full', 'medium', 'portrait']
const ROW_LAYOUTS: ImageRowLayout[] = ['equal', 'wide-narrow', 'narrow-wide', 'portrait-pair']
const TRIPLE_LAYOUTS: ImageTripleLayout[] = ['thirds', 'thirds-portrait']

function isStudioBlock(value: unknown): value is StudioBlock {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.type !== 'string') {
    return false
  }

  switch (value.type) {
    case 'text':
    case 'caption':
      return isLocalizedText(value.content)
    case 'location':
      return (
        isLocalizedText(value.label)
        && (value.coordinates === undefined || isLocalizedText(value.coordinates))
      )
    case 'image':
      return (
        IMAGE_SIZES.includes(value.size as ImageSize)
        && typeof value.showCaption === 'boolean'
        && isStudioImage(value.image)
      )
    case 'image-row':
      return (
        (value.layout === undefined || ROW_LAYOUTS.includes(value.layout as ImageRowLayout))
        && typeof value.showCaption === 'boolean'
        && Array.isArray(value.images)
        && value.images.length === 2
        && value.images.every(isStudioImage)
      )
    case 'image-triple':
      return (
        TRIPLE_LAYOUTS.includes(value.layout as ImageTripleLayout)
        && typeof value.showCaption === 'boolean'
        && Array.isArray(value.images)
        && value.images.length === 3
        && value.images.every(isStudioImage)
      )
    default:
      return false
  }
}

function isStudioDraft(value: unknown): value is StudioDraft {
  if (!isRecord(value)) return false
  if (typeof value.title !== 'string') return false
  if (typeof value.kicker !== 'string') return false
  if (typeof value.intro !== 'string') return false
  if (!Array.isArray(value.blocks) || !value.blocks.every(isStudioBlock)) return false
  return true
}

/** Returns a validated document, or null if the value is not a usable v1 draft. */
export function parseDraftDocument(value: unknown): StudioDraftDocument | null {
  if (!isRecord(value)) return null
  if (value.schemaVersion !== DRAFT_SCHEMA_VERSION) return null
  if (typeof value.id !== 'string') return null
  if (typeof value.updatedAt !== 'string') return null
  if (!isStudioDraft(value.draft)) return null

  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    id: value.id,
    updatedAt: value.updatedAt,
    draft: value.draft,
  }
}
