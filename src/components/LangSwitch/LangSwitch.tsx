'use client'

import { Check, ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LANG_LABELS, LANG_NAMES, LANGS, localizeHref } from '@/i18n/locales.mjs'
import { useLang, usePagePath, useT } from '../LangProvider/LangProvider'
import styles from './LangSwitch.module.css'

/**
 * Язык сайта в первой строке шапки (решение владельца 06.11.2026: всегда под рукой, и на
 * компьютере, и на телефоне). Кнопка с текущим языком («RU»), нажатие открывает панель
 * с тремя языками — шторкой сверху вниз и строками из размытия, как «О компании».
 * Языки — обычные ссылки, а не переход внутри сайта: шапка и подвал переводятся целиком.
 */
export function LangSwitch() {
  const lang = useLang()
  const t = useT()
  const path = usePagePath()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  // Параметры адреса (условия каталога, запрос поиска) — после загрузки: на сервере их нет.
  const [query, setQuery] = useState('')
  // biome-ignore lint/correctness/useExhaustiveDependencies: перешли на другую страницу — новые параметры, панель закрыта
  useEffect(() => {
    setQuery(window.location.search)
    setOpen(false)
  }, [path])

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      button.current?.focus()
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className={styles.wrap}>
      <button
        ref={button}
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls="site-lang"
        aria-label={`${t('Язык сайта')}: ${LANG_NAMES[lang]}`}
        title={t('Язык сайта')}
        onClick={() => setOpen(!open)}
      >
        <Globe size={20} strokeWidth={1.75} className={styles.globe} aria-hidden="true" />
        <span className={styles.code}>{LANG_LABELS[lang]}</span>
        <ChevronDown size={16} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </button>
      <nav
        id="site-lang"
        aria-label={t('Язык сайта')}
        className={styles.panel}
        data-open={open}
        inert={!open}
      >
        <p className={styles.caption}>{t('Язык сайта')}</p>
        {LANGS.map((code) => (
          <a
            key={code}
            href={`${localizeHref(code, path)}${query}`}
            hrefLang={code}
            lang={code}
            className={styles.item}
            aria-current={code === lang ? 'true' : undefined}
          >
            <span className={styles.badge}>{LANG_LABELS[code]}</span>
            <span className={styles.name}>{LANG_NAMES[code]}</span>
            {code === lang && (
              <Check size={16} strokeWidth={1.75} className={styles.check} aria-hidden="true" />
            )}
          </a>
        ))}
      </nav>
    </div>
  )
}
