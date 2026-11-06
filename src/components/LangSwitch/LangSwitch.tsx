'use client'

import { useEffect, useState } from 'react'
import { LANG_LABELS, LANG_NAMES, LANGS, localizeHref } from '@/i18n/locales.mjs'
import { useLang, usePagePath, useT } from '../LangProvider/LangProvider'
import styles from './LangSwitch.module.css'

/**
 * Переключатель языка RU / KZ / EN: та же страница на другом языке. Обычная ссылка, а не
 * переход внутри сайта: шапка и подвал переводятся целиком, без смеси языков.
 */
export function LangSwitch({ className }: { className?: string }) {
  const lang = useLang()
  const t = useT()
  const path = usePagePath()
  // Параметры адреса (условия каталога, запрос поиска) — после загрузки: на сервере их нет.
  const [query, setQuery] = useState('')
  // biome-ignore lint/correctness/useExhaustiveDependencies: параметры обновляются вместе со страницей
  useEffect(() => setQuery(window.location.search), [path])
  return (
    <nav
      aria-label={t('Язык сайта')}
      className={[styles.switch, className].filter(Boolean).join(' ')}
    >
      {LANGS.map((code) => (
        <a
          key={code}
          href={`${localizeHref(code, path)}${query}`}
          hrefLang={code}
          lang={code}
          title={LANG_NAMES[code]}
          className={styles.item}
          aria-current={code === lang ? 'true' : undefined}
        >
          {LANG_LABELS[code]}
        </a>
      ))}
    </nav>
  )
}
