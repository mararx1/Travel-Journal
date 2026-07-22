import type { Locale, LocalizedText } from './types'

export type Page = 'journal' | 'stories' | 'story' | 'about'

export type LocalizedRoute = {
  locale: Locale
  page: Page
  slug?: string
}

export function localize(value: LocalizedText, locale: Locale) {
  return value[locale] ?? value.en
}

export function getRoute(pathname: string): LocalizedRoute {
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  const locale: Locale = segments[0] === 'ru' ? 'ru' : 'en'
  const path = locale === 'ru' ? segments.slice(1) : segments

  if (path[0] === 'stories' && path[1]) return { locale, page: 'story', slug: path[1] }
  if (path[0] === 'stories') return { locale, page: 'stories' }
  if (path[0] === 'about') return { locale, page: 'about' }
  return { locale, page: 'journal' }
}

export function getPath({ locale, page, slug }: LocalizedRoute) {
  const prefix = locale === 'ru' ? '/ru' : ''
  if (page === 'stories') return `${prefix}/stories`
  if (page === 'story' && slug) return `${prefix}/stories/${slug}`
  if (page === 'about') return `${prefix}/about`
  return prefix || '/'
}

export function withLocale(route: LocalizedRoute, locale: Locale): LocalizedRoute {
  return { ...route, locale }
}

export function formatDate(value: string, locale: Locale) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date)
}

export function formatPhotoCount(count: number, locale: Locale) {
  if (locale !== 'ru') return `${count} ${count === 1 ? 'photo' : 'photos'}`

  const lastTwo = count % 100
  const last = count % 10
  const word = lastTwo >= 11 && lastTwo <= 14
    ? 'фотографий'
    : last === 1
      ? 'фотография'
      : last >= 2 && last <= 4
        ? 'фотографии'
        : 'фотографий'

  return `${count} ${word}`
}
