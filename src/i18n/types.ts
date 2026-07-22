export const locales = ['en', 'ru'] as const

export type Locale = (typeof locales)[number]

export type LocalizedText = {
  en: string
  ru?: string
}

export type TranslationKey =
  | 'journal'
  | 'stories'
  | 'about'
  | 'allStories'
  | 'previousStory'
  | 'nextStory'
  | 'photo'
  | 'photos'
  | 'viewStory'
  | 'openPhoto'
  | 'closePhotoViewer'
  | 'previousPhoto'
  | 'nextPhoto'
  | 'primaryNavigation'
  | 'filterJournalByYear'
  | 'contact'
  | 'readStory'
  | 'aboutIntro'
  | 'project'
  | 'projectCopy'
  | 'photographyAndTravel'
  | 'photographyAndTravelCopy'
  | 'instagram'
  | 'email'
  | 'aboutImageAlt'
  | 'home'
  | 'language'
  | 'storyNavigation'
  | 'storiesIntro'
