import type { LocalizedText } from '../i18n/types'

type JournalPhotoSource = {
  id: string
  image: string
  alt: string
  date: string
  location: string
  storyTitle: string
  caption?: string
  orientation?: 'portrait' | 'landscape'
}

export type JournalPhoto = Omit<JournalPhotoSource, 'alt' | 'location' | 'storyTitle' | 'caption'> & {
  alt: LocalizedText
  location: LocalizedText
  storyTitle: LocalizedText
  caption?: LocalizedText
}

export type JournalRowLayout =
  | 'single'
  | 'half'
  | 'half-portrait'
  | 'sixty-forty'
  | 'forty-sixty'
  | 'thirds'
  | 'thirds-portrait'
  | 'portrait-duo'

type JournalRowSource = {
  id: string
  year: number
  layout: JournalRowLayout
  photos: JournalPhotoSource[]
}

export type JournalRow = Omit<JournalRowSource, 'photos'> & { photos: JournalPhoto[] }

const journalRowsSource: JournalRowSource[] = [
  {
    id: '2026-thirds-poti',
    year: 2026,
    layout: 'thirds',
    photos: [
      {
        id: 'port-hull-marks',
        image: '/images/journal/port-hull-marks.JPG',
        alt: "Draft marks and a mooring rope on a ship's red hull",
        date: '2026-02-11',
        location: 'Poti, Georgia',
        storyTitle: 'Last light in Poti',
        orientation: 'portrait',
      },
      {
        id: 'poti-sunset-sea',
        image: '/images/journal/poti-sunset-sea.JPG',
        alt: 'A red sunset over the sea beyond a row of palms',
        date: '2026-02-12',
        location: 'Poti, Georgia',
        storyTitle: 'Last light in Poti',
        orientation: 'portrait',
      },
      {
        id: 'port-crane-detail',
        image: '/images/journal/port-crane-detail.JPG',
        alt: 'A crane platform with pipes and ladders against the sky',
        date: '2026-02-13',
        location: 'Poti, Georgia',
        storyTitle: 'Last light in Poti',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2026-portrait-duo',
    year: 2026,
    layout: 'portrait-duo',
    photos: [
      {
        id: 'before-the-rain',
        image: '/images/journal/tbilisi-street.JPG',
        alt: 'A quiet Tbilisi street with flowering trees at dusk',
        date: '2026-05-16',
        location: 'Tbilisi, Georgia',
        storyTitle: 'Before the rain',
        orientation: 'portrait',
      },
      {
        id: 'roads-above-the-valley',
        image: '/images/journal/lead-mountain-road.JPG',
        alt: 'A mountain road winding across green hills beneath a dramatic sky',
        date: '2026-05-15',
        location: 'Samtskhe-Javakheti, Georgia',
        storyTitle: 'Roads above the valley',
        orientation: 'landscape',
      },
      {
        id: 'river-house',
        image: '/images/journal/river-house.JPG',
        alt: 'A house beside a river in a green valley',
        date: '2026-06-02',
        location: 'Racha, Georgia',
        storyTitle: 'River house',
        orientation: 'landscape',
      },
    ],
  },
  {
    id: '2026-thirds',
    year: 2026,
    layout: 'thirds-portrait',
    photos: [
      {
        id: 'caves-of-the-rioni',
        image: '/images/stories/cliff-cave.JPG',
        alt: 'A limestone cliff and cave below a cloudy sky',
        date: '2026-04-20',
        location: 'Chiatura, Georgia',
        storyTitle: 'Caves of the Rioni',
        orientation: 'portrait',
      },
      {
        id: 'road-to-trialeti',
        image: '/images/stories/dirt-road.JPG',
        alt: 'A dirt road crossing green hills under a cloudy sky',
        date: '2026-04-21',
        location: 'Trialeti Range, Georgia',
        storyTitle: 'Road to Trialeti',
        orientation: 'portrait',
      },
      {
        id: 'wind-across-the-hills',
        image: '/images/journal/sunset-hills.JPG',
        alt: 'Sunset over grassy hills beneath a cloudy sky',
        date: '2026-05-29',
        location: 'Trialeti Range, Georgia',
        storyTitle: 'Wind across the hills',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2026-half-portrait',
    year: 2026,
    layout: 'half-portrait',
    photos: [
      {
        id: 'camp-by-the-river',
        image: '/images/stories/river-camp.JPG',
        alt: 'A small camp beside a forest river',
        date: '2026-06-08',
        location: 'Racha, Georgia',
        storyTitle: 'Camp by the river',
        orientation: 'portrait',
      },
      {
        id: 'weather-in-racha',
        image: '/images/stories/forest-car.JPG',
        alt: 'A car parked below a misty forested mountain',
        date: '2026-06-30',
        location: 'Racha, Georgia',
        storyTitle: 'Weather in Racha',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2026-sixty-forty-camp',
    year: 2026,
    layout: 'sixty-forty',
    photos: [
      {
        id: 'forest-camp-stove',
        image: '/images/journal/forest-camp-stove.JPG',
        alt: 'A camp stove and mugs on a table in a misty, mossy forest',
        date: '2026-06-05',
        location: 'Racha, Georgia',
        storyTitle: 'Camp by the river',
        orientation: 'landscape',
      },
      {
        id: 'tbilisi-old-town-car',
        image: '/images/journal/tbilisi-old-town-car.JPG',
        alt: 'A car parked on a cobbled street beneath bare, balconied buildings',
        date: '2026-05-17',
        location: 'Tbilisi, Georgia',
        storyTitle: 'Before the rain',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2026-forty-sixty-camp',
    year: 2026,
    layout: 'forty-sixty',
    photos: [
      {
        id: 'camp-gear',
        image: '/images/journal/camp-gear.JPG',
        alt: 'Camera and radio equipment resting on a tree stump',
        date: '2026-06-06',
        location: 'Racha, Georgia',
        storyTitle: 'Camp by the river',
        orientation: 'portrait',
      },
      {
        id: 'forest-leaves',
        image: '/images/journal/forest-leaves.JPG',
        alt: 'A hand holding a sprig of green leaves in the forest',
        date: '2026-06-07',
        location: 'Racha, Georgia',
        storyTitle: 'Camp by the river',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2026-half-forest',
    year: 2026,
    layout: 'half',
    photos: [
      {
        id: 'forest-stream',
        image: '/images/journal/forest-stream.JPG',
        alt: 'A narrow stream through dense green forest',
        date: '2026-06-27',
        location: 'Racha, Georgia',
        storyTitle: 'Weather in Racha',
        orientation: 'portrait',
      },
      {
        id: 'forest-car-parked',
        image: '/images/journal/forest-car-parked.JPG',
        alt: 'A car parked among tall pines in fading light',
        date: '2026-06-29',
        location: 'Racha, Georgia',
        storyTitle: 'Weather in Racha',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2025-half-portrait-a',
    year: 2025,
    layout: 'half-portrait',
    photos: [
      {
        id: 'at-the-edge-of-the-port',
        image: '/images/journal/port-crane.jpg',
        alt: 'A shipyard crane above the sea at dusk',
        date: '2025-02-14',
        location: 'Poti, Georgia',
        storyTitle: 'At the edge of the port',
        orientation: 'portrait',
      },
      {
        id: 'morning-by-the-river',
        image: '/images/journal/forest-river.JPG',
        alt: 'A river flowing through a wooded valley',
        date: '2025-03-31',
        location: 'Racha, Georgia',
        storyTitle: 'Morning by the river',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2025-half-portrait-b',
    year: 2025,
    layout: 'half-portrait',
    photos: [
      {
        id: 'rock-face',
        image: '/images/stories/rock-face.JPG',
        alt: 'A rock face framed by spring leaves',
        date: '2025-04-05',
        location: 'Chiatura, Georgia',
        storyTitle: 'Caves of the Rioni',
        orientation: 'portrait',
      },
      {
        id: 'forest-mushroom',
        image: '/images/stories/forest-mushroom.JPG',
        alt: 'A bracket fungus growing on a tree trunk',
        date: '2025-05-05',
        location: 'Trialeti Range, Georgia',
        storyTitle: 'Road to Trialeti',
        orientation: 'portrait',
      },
    ],
  },
  {
    id: '2024-single',
    year: 2024,
    layout: 'single',
    photos: [
      {
        id: 'last-light-in-poti',
        image: '/images/stories/travel-kit.JPG',
        alt: 'Camera equipment and a radio resting on a wooden bench',
        date: '2024-11-03',
        location: 'Poti, Georgia',
        storyTitle: 'Last light in Poti',
        orientation: 'portrait',
      },
    ],
  },
]

const russianText: Record<string, string> = {
  'Last light in Poti': 'Последний свет в Поти',
  'Before the rain': 'Перед дождём',
  'Roads above the valley': 'Дороги над долиной',
  'River house': 'Дом у реки',
  'Caves of the Rioni': 'Пещеры Риони',
  'Road to Trialeti': 'Дорога в Триалети',
  'Wind across the hills': 'Ветер над холмами',
  'Camp by the river': 'Лагерь у реки',
  'Weather in Racha': 'Погода в Раче',
  'At the edge of the port': 'На краю порта',
  'Morning by the river': 'Утро у реки',
  'Poti, Georgia': 'Поти, Грузия',
  'Tbilisi, Georgia': 'Тбилиси, Грузия',
  'Samtskhe-Javakheti, Georgia': 'Самцхе-Джавахети, Грузия',
  'Racha, Georgia': 'Рача, Грузия',
  'Chiatura, Georgia': 'Чиатура, Грузия',
  'Trialeti Range, Georgia': 'Триалетский хребет, Грузия',
}

function text(en: string): LocalizedText {
  return { en, ru: russianText[en] }
}

export const journalRows: JournalRow[] = journalRowsSource.map((row) => ({
  ...row,
  photos: row.photos.map((photo) => ({
    ...photo,
    alt: text(photo.alt),
    location: text(photo.location),
    storyTitle: text(photo.storyTitle),
    caption: photo.caption ? text(photo.caption) : undefined,
  })),
}))

export const journalYears = [...new Set(journalRows.map((row) => row.year))].sort((a, b) => b - a)
