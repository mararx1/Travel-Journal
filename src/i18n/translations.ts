import type { Locale, TranslationKey } from './types'

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    journal: 'Journal',
    stories: 'Stories',
    about: 'About',
    allStories: 'All stories',
    previousStory: 'Previous story',
    nextStory: 'Next story',
    photo: 'photo',
    photos: 'photos',
    viewStory: 'View story',
    openPhoto: 'Open {title} photo',
    closePhotoViewer: 'Close photo viewer',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    primaryNavigation: 'Primary navigation',
    filterJournalByYear: 'Filter journal by year',
    contact: 'Contact',
    readStory: 'Read {title}',
    aboutIntro: 'mararx.com is Denis’s visual journal of trips, places, small observations, and photographs—mostly made while travelling around Georgia.',
    project: 'The project',
    projectCopy: 'A place to keep the details that stay after a journey: a road, a room, a change in weather, or the way a landscape looked for a moment.',
    photographyAndTravel: 'Photography and travel',
    photographyAndTravelCopy: 'The photographs are made slowly and without a fixed itinerary. They follow walks, drives, conversations, and the ordinary time spent getting somewhere.',
    instagram: 'Instagram',
    email: 'Email',
    aboutImageAlt: 'A car parked below a misty forested mountain',
    home: 'mararx home',
    language: 'Language',
    storyNavigation: 'Story navigation',
    storiesIntro: 'Trips, places, and photographs collected into longer visual narratives.',
    switchToRussian: 'Switch to Russian',
    switchToEnglish: 'Switch to English',
  },
  ru: {
    journal: 'Журнал',
    stories: 'Истории',
    about: 'О проекте',
    allStories: 'Все истории',
    previousStory: 'Предыдущая история',
    nextStory: 'Следующая история',
    photo: 'фото',
    photos: 'фото',
    viewStory: 'Открыть историю',
    openPhoto: 'Открыть фото: {title}',
    closePhotoViewer: 'Закрыть просмотр фотографий',
    previousPhoto: 'Предыдущее фото',
    nextPhoto: 'Следующее фото',
    primaryNavigation: 'Основная навигация',
    filterJournalByYear: 'Фильтр журнала по годам',
    contact: 'Контакты',
    readStory: 'Читать: {title}',
    aboutIntro: 'mararx.com — визуальный журнал Дениса о поездках, местах, небольших наблюдениях и фотографиях, в основном сделанных во время путешествий по Грузии.',
    project: 'Проект',
    projectCopy: 'Место для деталей, которые остаются после поездки: дороги, комнаты, перемены погоды или мимолётного вида пейзажа.',
    photographyAndTravel: 'Фотография и путешествия',
    photographyAndTravelCopy: 'Фотографии создаются не спеша и без фиксированного маршрута. За ними — прогулки, поездки, разговоры и обычное время в пути.',
    instagram: 'Instagram',
    email: 'Почта',
    aboutImageAlt: 'Автомобиль под туманной лесистой горой',
    home: 'Главная mararx',
    language: 'Язык',
    storyNavigation: 'Навигация по историям',
    storiesIntro: 'Поездки, места и фотографии, собранные в длинные визуальные истории.',
    switchToRussian: 'Переключить на русский',
    switchToEnglish: 'Переключить на английский',
  },
}

export function translate(locale: Locale, key: TranslationKey, values?: Record<string, string | number>) {
  let value = translations[locale][key] ?? translations.en[key]

  for (const [name, replacement] of Object.entries(values ?? {})) {
    value = value.replaceAll(`{${name}}`, String(replacement))
  }

  return value
}
