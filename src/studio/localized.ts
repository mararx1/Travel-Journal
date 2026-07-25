import type { LocalizedText } from '../i18n/types'
import type { Locale } from '../i18n/types'

/** Update one locale on LocalizedText without touching the other. */
export function setLocalizedField(
  current: LocalizedText | undefined,
  locale: Locale,
  value: string,
): LocalizedText {
  const en = locale === 'en' ? value : (current?.en ?? '')
  const ru = locale === 'ru' ? value : current?.ru

  if (locale === 'ru' && !value) {
    return { en }
  }

  return ru ? { en, ru } : { en }
}

export function localizedValue(current: LocalizedText | undefined, locale: Locale) {
  if (!current) return ''
  return locale === 'ru' ? (current.ru ?? '') : current.en
}
