'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import { localizeHref } from '@/i18n/locales.mjs'
import { useLang } from '../LangProvider/LangProvider'

/**
 * Ссылка сайта: та же next/link, но адрес страницы сама переводит на язык страницы
 * (/catalog → /kk/catalog). Во всех компонентах витрины — вместо next/link.
 */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const lang = useLang()
  const localized =
    typeof href === 'string'
      ? localizeHref(lang, href)
      : { ...href, pathname: href.pathname ? localizeHref(lang, href.pathname) : href.pathname }
  return <NextLink href={localized} {...rest} />
}
