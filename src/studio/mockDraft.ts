import type { StudioDraft } from './types'

/** Seeds Phase 1 canvas appearance (Chiatura / Untitled Story placeholders). */
export const initialDraft: StudioDraft = {
  title: 'Untitled Story',
  kicker: 'April 2025 · Chiatura, Georgia',
  intro:
    'Canvas preview using public-site image primitives and layout classes. Photos are existing files under public/images/.',
  blocks: [
    {
      id: 'block-lead',
      type: 'image',
      size: 'full',
      showCaption: true,
      image: {
        src: '/images/stories/cliff-cave.JPG',
        alt: { en: 'A limestone cliff and cave below a cloudy sky' },
        caption: { en: 'Lead photograph — public story asset' },
      },
    },
    {
      id: 'block-pair',
      type: 'image-row',
      layout: 'portrait-pair',
      showCaption: false,
      images: [
        {
          src: '/images/stories/rock-face.JPG',
          alt: { en: 'A rock face framed by spring leaves' },
          orientation: 'portrait',
        },
        {
          src: '/images/stories/forest-mushroom.JPG',
          alt: { en: 'A bracket fungus growing on a tree trunk' },
          orientation: 'portrait',
        },
      ],
    },
    {
      id: 'block-text',
      type: 'text',
      content: {
        en: 'Sample text block. Layout below reuses Journal row classes (`jrow--thirds`) with existing journal images.',
      },
    },
  ],
}
