import type { LocalizedText } from '../i18n/types'

type StoryImageSource = {
  src: string
  alt?: string
  caption?: string
  orientation?: 'portrait' | 'landscape' | 'wide'
}

export type StoryImage = Omit<StoryImageSource, 'alt' | 'caption'> & {
  alt?: LocalizedText
  caption?: LocalizedText
}

type StoryContentBlockSource =
  | { type: 'text'; content: string }
  | { type: 'image'; size: 'full' | 'medium' | 'portrait'; image: StoryImageSource }
  | {
      type: 'image-row'
      layout?: 'equal' | 'wide-narrow' | 'narrow-wide' | 'portrait-pair'
      images: [StoryImageSource, StoryImageSource]
    }
  | { type: 'caption'; content: string }
  | { type: 'location'; label: string; coordinates?: string }

export type StoryContentBlock =
  | { type: 'text'; content: LocalizedText }
  | { type: 'image'; size: 'full' | 'medium' | 'portrait'; image: StoryImage }
  | { type: 'image-row'; layout?: 'equal' | 'wide-narrow' | 'narrow-wide' | 'portrait-pair'; images: [StoryImage, StoryImage] }
  | { type: 'caption'; content: LocalizedText }
  | { type: 'location'; label: LocalizedText; coordinates?: LocalizedText }

const chiaturaCavesContentSource: StoryContentBlockSource[] = [
  {
    type: 'image-row',
    layout: 'portrait-pair',
    images: [
      {
        src: '/images/stories/cliff-cave.JPG',
        alt: 'A limestone cliff and cave below a cloudy sky',
        caption: 'The cave mouth above the old road.',
        orientation: 'portrait',
      },
      {
        src: '/images/stories/rock-face.JPG',
        alt: 'A rock face framed by spring leaves',
        orientation: 'portrait',
      },
    ],
  },
  {
    type: 'text',
    content: 'The road ends above the valley. From there, the path follows the wet rock and the sound of water below.',
  },
  {
    type: 'image-row',
    layout: 'wide-narrow',
    images: [
      {
        src: '/images/journal/river-house.JPG',
        alt: 'A house beside a river in a green valley',
        orientation: 'landscape',
      },
      {
        src: '/images/stories/river-camp.JPG',
        alt: 'A small camp beside a forest river',
        orientation: 'portrait',
      },
    ],
  },
  {
    type: 'text',
    content: 'Every opening in the trees held a different piece of the river: gray water, green banks, and the soft light before rain.',
  },
  {
    type: 'image',
    size: 'full',
    image: {
      src: '/images/journal/lead-mountain-road.JPG',
      alt: 'A mountain road winding across green hills beneath a dramatic sky',
      caption: 'The last stretch of road before the descent to the river.',
      orientation: 'wide',
    },
  },
  {
    type: 'image-row',
    layout: 'portrait-pair',
    images: [
      {
        src: '/images/journal/forest-river.JPG',
        alt: 'A river flowing through a wooded valley',
        orientation: 'portrait',
      },
      {
        src: '/images/stories/forest-car.JPG',
        alt: 'A car parked below a misty forested mountain',
        orientation: 'portrait',
      },
    ],
  },
  {
    type: 'image-row',
    layout: 'portrait-pair',
    images: [
      {
        src: '/images/stories/forest-mushroom.JPG',
        alt: 'A bracket fungus growing on a tree trunk',
        orientation: 'portrait',
      },
      {
        src: '/images/stories/dirt-road.JPG',
        alt: 'A dirt road crossing green hills under a cloudy sky',
        orientation: 'portrait',
      },
    ],
  },
]

const russianText: Record<string, string> = {
  'The cave mouth above the old road.': 'Вход в пещеру над старой дорогой.',
  'A limestone cliff and cave below a cloudy sky': 'Известняковая скала и пещера под облачным небом',
  'A rock face framed by spring leaves': 'Скала в обрамлении весенней листвы',
  'A house beside a river in a green valley': 'Дом у реки в зелёной долине',
  'A small camp beside a forest river': 'Небольшой лагерь у лесной реки',
  'A mountain road winding across green hills beneath a dramatic sky': 'Горная дорога среди зелёных холмов под выразительным небом',
  'A river flowing through a wooded valley': 'Река, текущая через лесистую долину',
  'A car parked below a misty forested mountain': 'Автомобиль у туманной лесистой горы',
  'A bracket fungus growing on a tree trunk': 'Трутовик, растущий на стволе дерева',
  'A dirt road crossing green hills under a cloudy sky': 'Грунтовая дорога через зелёные холмы под облачным небом',
  'The road ends above the valley. From there, the path follows the wet rock and the sound of water below.': 'Дорога заканчивается над долиной. Дальше тропа идёт вдоль мокрых скал и звука воды внизу.',
  'Every opening in the trees held a different piece of the river: gray water, green banks, and the soft light before rain.': 'В каждом просвете между деревьями открывалась другая часть реки: серая вода, зелёные берега и мягкий свет перед дождём.',
  'The last stretch of road before the descent to the river.': 'Последний участок дороги перед спуском к реке.',
}

function text(en: string): LocalizedText {
  return { en, ru: russianText[en] }
}

function image(source: StoryImageSource): StoryImage {
  return {
    ...source,
    alt: source.alt ? text(source.alt) : undefined,
    caption: source.caption ? text(source.caption) : undefined,
  }
}

export const chiaturaCavesContent: StoryContentBlock[] = chiaturaCavesContentSource.map((block) => {
  if (block.type === 'text' || block.type === 'caption') return { ...block, content: text(block.content) }
  if (block.type === 'location') return { ...block, label: text(block.label), coordinates: block.coordinates ? text(block.coordinates) : undefined }
  if (block.type === 'image-row') return { ...block, images: [image(block.images[0]), image(block.images[1])] }
  return { ...block, image: image(block.image) }
})
