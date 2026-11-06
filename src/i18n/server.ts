import { headers } from 'next/headers'
import { DEFAULT_LANG, isLang, LANG_HEADER, type Lang } from './locales.mjs'
import { messagesFor } from './messages'
import { translate } from './translate.mjs'

/** Язык текущего запроса: его передаёт src/proxy.ts по приставке /kk или /en. */
export async function getLang(): Promise<Lang> {
  const value = (await headers()).get(LANG_HEADER)
  return isLang(value) ? value : DEFAULT_LANG
}

export type T = (text: string, vars?: Record<string, string | number>) => string

/** Перевод для серверных компонентов: const t = await getT(); t('Каталог'). */
export async function getT(): Promise<T> {
  const messages = messagesFor(await getLang())
  return (text, vars) => translate(messages, text, vars)
}
