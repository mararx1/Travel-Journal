import type { LocalizedText } from '../i18n/types'

export type StudioImage = {
  src: string
  /** Library asset id when the image came from local import. */
  assetId?: string
  alt?: LocalizedText
  caption?: LocalizedText
  orientation?: 'portrait' | 'landscape' | 'wide'
  placeholder?: boolean
}

export type ImageRowLayout = 'equal' | 'wide-narrow' | 'narrow-wide' | 'portrait-pair'
export type ImageSize = 'full' | 'medium' | 'portrait'
export type ImageTripleLayout = 'thirds' | 'thirds-portrait'

export type StudioBlock =
  | { id: string; type: 'text'; content: LocalizedText }
  | {
      id: string
      type: 'image'
      size: ImageSize
      image: StudioImage
      showCaption: boolean
    }
  | {
      id: string
      type: 'image-row'
      layout?: ImageRowLayout
      images: [StudioImage, StudioImage]
      showCaption: boolean
    }
  | {
      id: string
      type: 'image-triple'
      layout: ImageTripleLayout
      images: [StudioImage, StudioImage, StudioImage]
      showCaption: boolean
    }
  | { id: string; type: 'caption'; content: LocalizedText }
  | { id: string; type: 'location'; label: LocalizedText; coordinates?: LocalizedText }

export type StudioDraft = {
  title: string
  kicker: string
  intro: string
  blocks: StudioBlock[]
}

export type AddBlockKind =
  | 'text'
  | 'image'
  | 'image-row'
  | 'image-row-asymmetric'
  | 'image-triple'
  | 'caption'
  | 'location'
