import type { Lang } from './locales.mjs'
import en from './messages/en.json'
import kk from './messages/kk.json'
import type { Messages } from './translate.mjs'

/** Словарь языка; у русского словаря нет — ключи и есть русский текст. */
export function messagesFor(lang: Lang): Messages | null {
  if (lang === 'kk') return kk
  if (lang === 'en') return en
  return null
}
