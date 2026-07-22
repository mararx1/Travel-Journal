import type { LocalizedText } from '../i18n/types'

type StoryPreviewSource = {
  id: string
  coverImage: string
  coverAlt: string
  detailImage?: string
  detailAlt?: string
  title: string
  location: string
  date: string
  description: string
  intro?: string
  photoCount?: number
  route?: '/stories/chiatura-caves'
}

export type StoryPreview = Omit<StoryPreviewSource, 'coverAlt' | 'detailAlt' | 'title' | 'location' | 'description' | 'intro'> & {
  coverAlt: LocalizedText
  detailAlt?: LocalizedText
  title: LocalizedText
  location: LocalizedText
  description: LocalizedText
  intro?: LocalizedText
}

const storyPreviewsSource: StoryPreviewSource[] = [
  {
    id: 'caves-of-rioni',
    coverImage: '/images/stories/cliff-cave.JPG',
    coverAlt: 'A limestone cliff and cave below a cloudy sky',
    detailImage: '/images/stories/rock-face.JPG',
    detailAlt: 'A rock face framed by spring leaves',
    title: 'Caves of the Rioni',
    location: 'Chiatura, Georgia',
    date: '2025-04-01',
    description: 'Limestone walls, wet paths, and the river below the old road.',
    intro: 'Limestone walls, wet paths, and the river below the old road. A slow afternoon following the caves above the Rioni.',
    photoCount: 18,
    route: '/stories/chiatura-caves',
  },
  {
    id: 'road-to-trialeti',
    coverImage: '/images/stories/dirt-road.JPG',
    coverAlt: 'A dirt road crossing green hills under a cloudy sky',
    detailImage: '/images/stories/forest-mushroom.JPG',
    detailAlt: 'A bracket fungus growing on a tree trunk',
    title: 'Road to Trialeti',
    location: 'Trialeti Range, Georgia',
    date: '2025-05-01',
    description: 'Following the slow roads as the day opens over the high grasslands.',
    photoCount: 14,
  },
  {
    id: 'last-light-in-poti',
    coverImage: '/images/stories/port-crane.jpg',
    coverAlt: 'A shipyard crane above the sea at dusk',
    detailImage: '/images/stories/travel-kit.JPG',
    detailAlt: 'Camera equipment and a radio resting on a wooden bench',
    title: 'Last light in Poti',
    location: 'Poti, Georgia',
    date: '2025-02-01',
    description: 'An evening at the port, where the cranes meet the darkening water.',
    photoCount: 12,
  },
  {
    id: 'camp-by-the-river',
    coverImage: '/images/stories/river-camp.JPG',
    coverAlt: 'A small camp beside a forest river',
    title: 'Camp by the river',
    location: 'Racha, Georgia',
    date: '2025-03-01',
    description: 'A late lunch beside fast water and the first green of spring.',
    photoCount: 16,
  },
  {
    id: 'weather-in-racha',
    coverImage: '/images/stories/forest-car.JPG',
    coverAlt: 'A car parked below a misty forested mountain',
    title: 'Weather in Racha',
    location: 'Racha, Georgia',
    date: '2025-07-01',
    description: 'Low clouds held in the trees through an afternoon of rain.',
    photoCount: 21,
  },
  {
    id: 'wind-on-the-hills',
    coverImage: '/images/stories/sunset-hills.JPG',
    coverAlt: 'Sunset over grassy hills beneath a cloudy sky',
    title: 'Wind on the hills',
    location: 'Samtskhe-Javakheti, Georgia',
    date: '2025-05-01',
    description: 'Long grass, sudden light, and a last view across the valley.',
    photoCount: 15,
  },
  {
    id: 'river-house',
    coverImage: '/images/journal/river-house.JPG',
    coverAlt: 'A house beside a river in a green valley',
    title: 'River house',
    location: 'Racha, Georgia',
    date: '2025-06-01',
    description: 'A quiet house above the river, reached at the end of a wet road.',
    photoCount: 10,
  },
  {
    id: 'morning-by-the-river',
    coverImage: '/images/journal/forest-river.JPG',
    coverAlt: 'A river flowing through a wooded valley',
    title: 'Morning by the river',
    location: 'Racha, Georgia',
    date: '2025-03-01',
    description: 'Cold water moving through the woods before the day had fully opened.',
    photoCount: 13,
  },
  {
    id: 'before-the-rain',
    coverImage: '/images/journal/tbilisi-street.JPG',
    coverAlt: 'A quiet Tbilisi street with flowering trees at dusk',
    title: 'Before the rain',
    location: 'Tbilisi, Georgia',
    date: '2025-07-01',
    description: 'A walk through the city while the first drops gathered on the pavement.',
    photoCount: 9,
  },
]

const russianText: Record<string, string> = {
  'A limestone cliff and cave below a cloudy sky': 'Известняковая скала и пещера под облачным небом',
  'A rock face framed by spring leaves': 'Скала в обрамлении весенней листвы',
  'A dirt road crossing green hills under a cloudy sky': 'Грунтовая дорога через зелёные холмы под облачным небом',
  'A bracket fungus growing on a tree trunk': 'Трутовик, растущий на стволе дерева',
  'A shipyard crane above the sea at dusk': 'Портовый кран над морем в сумерках',
  'Camera equipment and a radio resting on a wooden bench': 'Камера и радиооборудование на деревянной скамье',
  'A small camp beside a forest river': 'Небольшой лагерь у лесной реки',
  'A car parked below a misty forested mountain': 'Автомобиль у туманной лесистой горы',
  'Sunset over grassy hills beneath a cloudy sky': 'Закат над травянистыми холмами под облачным небом',
  'A house beside a river in a green valley': 'Дом у реки в зелёной долине',
  'A river flowing through a wooded valley': 'Река, текущая через лесистую долину',
  'A quiet Tbilisi street with flowering trees at dusk': 'Тихая тбилисская улица с цветущими деревьями в сумерках',
  'Caves of the Rioni': 'Пещеры Риони',
  'Road to Trialeti': 'Дорога в Триалети',
  'Last light in Poti': 'Последний свет в Поти',
  'Camp by the river': 'Лагерь у реки',
  'Weather in Racha': 'Погода в Раче',
  'Wind on the hills': 'Ветер на холмах',
  'River house': 'Дом у реки',
  'Morning by the river': 'Утро у реки',
  'Before the rain': 'Перед дождём',
  'Chiatura, Georgia': 'Чиатура, Грузия',
  'Trialeti Range, Georgia': 'Триалетский хребет, Грузия',
  'Poti, Georgia': 'Поти, Грузия',
  'Racha, Georgia': 'Рача, Грузия',
  'Samtskhe-Javakheti, Georgia': 'Самцхе-Джавахети, Грузия',
  'Tbilisi, Georgia': 'Тбилиси, Грузия',
  'Limestone walls, wet paths, and the river below the old road.': 'Известняковые стены, мокрые тропы и река под старой дорогой.',
  'Limestone walls, wet paths, and the river below the old road. A slow afternoon following the caves above the Rioni.': 'Известняковые стены, мокрые тропы и река под старой дорогой. Неторопливый день у пещер над Риони.',
  'Following the slow roads as the day opens over the high grasslands.': 'По медленным дорогам, пока день раскрывается над высокими лугами.',
  'An evening at the port, where the cranes meet the darkening water.': 'Вечер в порту, где краны встречаются с темнеющей водой.',
  'A late lunch beside fast water and the first green of spring.': 'Поздний обед у быстрой воды и первой весенней зелени.',
  'Low clouds held in the trees through an afternoon of rain.': 'Низкие облака держались в деревьях весь дождливый день.',
  'Long grass, sudden light, and a last view across the valley.': 'Высокая трава, внезапный свет и последний взгляд через долину.',
  'A quiet house above the river, reached at the end of a wet road.': 'Тихий дом над рекой в конце мокрой дороги.',
  'Cold water moving through the woods before the day had fully opened.': 'Холодная вода в лесу до того, как день окончательно открылся.',
  'A walk through the city while the first drops gathered on the pavement.': 'Прогулка по городу, пока первые капли собирались на мостовой.',
}

function text(en: string): LocalizedText {
  return { en, ru: russianText[en] }
}

export const storyPreviews: StoryPreview[] = storyPreviewsSource.map((story) => ({
  ...story,
  coverAlt: text(story.coverAlt),
  detailAlt: story.detailAlt ? text(story.detailAlt) : undefined,
  title: text(story.title),
  location: text(story.location),
  description: text(story.description),
  intro: story.intro ? text(story.intro) : undefined,
}))
