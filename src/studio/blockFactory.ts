import type { AddBlockKind, StudioBlock, StudioImage } from './types'

let blockSeq = 0

function nextId(prefix: string) {
  blockSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${blockSeq}`
}

export function createPlaceholderImage(slot: string): StudioImage {
  return {
    src: `placeholder:${slot}`,
    placeholder: true,
    alt: { en: '' },
  }
}

export function createBlock(kind: AddBlockKind): StudioBlock {
  switch (kind) {
    case 'text':
      return { id: nextId('text'), type: 'text', content: { en: '' } }
    case 'caption':
      return { id: nextId('caption'), type: 'caption', content: { en: '' } }
    case 'location':
      return { id: nextId('location'), type: 'location', label: { en: '' } }
    case 'image':
      return {
        id: nextId('image'),
        type: 'image',
        size: 'full',
        showCaption: false,
        image: createPlaceholderImage('a'),
      }
    case 'image-row':
      return {
        id: nextId('row'),
        type: 'image-row',
        layout: 'equal',
        showCaption: false,
        images: [createPlaceholderImage('a'), createPlaceholderImage('b')],
      }
    case 'image-row-asymmetric':
      return {
        id: nextId('row'),
        type: 'image-row',
        layout: 'wide-narrow',
        showCaption: false,
        images: [createPlaceholderImage('a'), createPlaceholderImage('b')],
      }
    case 'image-triple':
      return {
        id: nextId('triple'),
        type: 'image-triple',
        layout: 'thirds',
        showCaption: false,
        images: [
          createPlaceholderImage('a'),
          createPlaceholderImage('b'),
          createPlaceholderImage('c'),
        ],
      }
  }
}
