import { headers } from 'next/headers'
import { permanentRedirect, redirect } from 'next/navigation'
import { DEFAULT_LANG, isLang, LANG_HEADER, type Lang, localizeHref } from './locales.mjs'
import { messagesFor } from './messages'
import { makeT } from './translate.mjs'

/** Язык текущего запроса: его передаёт src/proxy.ts по приставке /kk или /en. */
export async function getLang(): Promise<Lang> {
  const value = (await headers()).get(LANG_HEADER)
  return isLang(value) ? value : DEFAULT_LANG
}

export type T = ReturnType<typeof makeT>

/** Перевод для серверных компонентов: const t = await getT(); t('Каталог'). */
export async function getT(): Promise<T> {
  const lang = await getLang()
  return makeT(lang, messagesFor(lang))
}

/**
 * Переход на другую страницу сайта с сохранением языка: на /en/… адрес из базы (/catalog/…)
 * получает приставку /en, иначе посетитель попадал на русскую страницу.
 */
export async function langRedirect(path: string): Promise<never> {
  redirect(localizeHref(await getLang(), path))
}

/** То же, постоянный переход (308): старые и неканонические адреса. */
export async function langPermanentRedirect(path: string): Promise<never> {
  permanentRedirect(localizeHref(await getLang(), path))
}
