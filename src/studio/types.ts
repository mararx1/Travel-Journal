import type { LocalizedText } from '../i18n/types'

export type StudioImage = {
  src: string
  alt?: LocalizedText
  caption?: LocalizedText
  orientation?: 'portrait' | 'landscape' | 'wide'
}

export type StudioBlock =
  | { id: string; type: 'text'; content: LocalizedText }
  | {
      id: string
      type: 'image'
      size: 'full' | 'medium' | 'portrait'
      image: StudioImage
      showCaption: boolean
    }
  | {
      id: string
      type: 'image-row'
      layout?: 'equal' | 'wide-narrow' | 'narrow-wide' | 'portrait-pair'
      images: [StudioImage, StudioImage]
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
