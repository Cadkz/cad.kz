'use client'

import { usePathname } from 'next/navigation'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { DEFAULT_LANG, type Lang, localizeHref, splitLangPath } from '@/i18n/locales.mjs'
import { type Messages, makeT } from '@/i18n/translate.mjs'

type Value = { lang: Lang; messages: Messages | null }

const LangContext = createContext<Value>({ lang: DEFAULT_LANG, messages: null })

/** Язык и словарь страницы для клиентских компонентов (ставит общий layout). */
export function LangProvider({ lang, messages, children }: Value & { children: ReactNode }) {
  return <LangContext.Provider value={{ lang, messages }}>{children}</LangContext.Provider>
}

export function useLang(): Lang {
  return useContext(LangContext).lang
}

/** Перевод в клиентских компонентах: const t = useT(); t('Корзина'). */
export function useT() {
  const { lang, messages } = useContext(LangContext)
  return useMemo(() => makeT(lang, messages), [lang, messages])
}

/** Адрес на языке страницы: для router.push и ссылок, собранных в коде. */
export function useLocalHref() {
  const lang = useLang()
  return (href: string) => localizeHref(lang, href)
}

/**
 * Адрес страницы без языковой приставки: /kk/catalog → /catalog. Нужен для сравнения
 * с пунктами меню — они записаны русскими адресами.
 */
export function usePagePath(): string {
  return splitLangPath(usePathname() ?? '/').path
}
