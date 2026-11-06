import { termTranslator } from '@/domain/terms.mjs'
import type { Lang } from '@/i18n/locales.mjs'
import { messagesFor } from '@/i18n/messages'
import { cmsData } from './payload'
import { siteCached } from './siteCache'

/**
 * Словарь переводов характеристик и комплектаций для витрины (коллекция «Словарь переводов»,
 * src/domain/terms.mjs): русский текст → перевод на язык страницы. Хранится в общем кэше сайта
 * (сбрасывается правкой словаря в админке и загрузкой таблицы), пустые переводы не попадают.
 */
function loadTerms(lang: Exclude<Lang, 'ru'>) {
  return async (): Promise<Record<string, string>> => {
    const payload = await cmsData()
    const { docs } = await payload.find({
      collection: 'terms',
      pagination: false,
      depth: 0,
      overrideAccess: true,
      select: { ru: true, [lang]: true },
    })
    // Объект, а не Map: кэш Next.js хранит данные как JSON.
    const result: Record<string, string> = {}
    for (const doc of docs) {
      const text = doc[lang]?.trim()
      if (text) result[doc.ru.trim()] = text
    }
    return result
  }
}

const cached = {
  kk: siteCached('terms-kk', loadTerms('kk')),
  en: siteCached('terms-en', loadTerms('en')),
}

/**
 * Перевод по словарю на языке страницы, затем по словарю интерфейса (src/i18n/messages: там уже
 * есть частые подписи вроде «Точность», «Подписка» — в таблицу словаря они не выгружаются);
 * нет перевода — русский. Для русского — текст как есть.
 */
export async function termsFor(lang: Lang): Promise<(text: string) => string> {
  if (lang === 'ru') return (text) => text
  const record = await cached[lang]()
  const messages = messagesFor(lang) ?? {}
  return termTranslator(new Map(Object.entries({ ...messages, ...record })))
}
