'use client'

import { useDocumentInfo, useField, useLocale } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { hintText, valueAtPath } from '@/domain/russianHint.mjs'
import { DEFAULT_LANG as DEFAULT_LOCALE } from '@/i18n/locales.mjs'
import styles from './RussianHint.module.css'

/** Русская версия документа: одна загрузка на документ, не дольше минуты (русский могли поправить). */
const cache = new Map<string, { at: number; doc: Promise<unknown> }>()
const FRESH_MS = 60_000

function russianDoc(url: string) {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.at < FRESH_MS) return cached.doc
  const doc = fetch(url, { credentials: 'include' })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null)
  cache.set(url, { at: Date.now(), doc })
  return doc
}

/**
 * Подсказка под пустым полем перевода (админка, язык Қазақша или English): русский текст этого
 * поля, чтобы переводить, не переключая язык. Поле заполнено или язык русский — ничего не видно.
 */
export function RussianHint({ path }: { path?: string }) {
  const { code } = useLocale()
  const { value } = useField<string>({ path: path ?? '' })
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const [russian, setRussian] = useState('')

  const translating = Boolean(path) && code !== DEFAULT_LOCALE
  const empty = typeof value !== 'string' || !value.trim()
  const url = globalSlug
    ? `/api/globals/${globalSlug}?locale=${DEFAULT_LOCALE}&depth=0&draft=true`
    : collectionSlug && id
      ? `/api/${collectionSlug}/${id}?locale=${DEFAULT_LOCALE}&depth=0&draft=true`
      : ''

  useEffect(() => {
    if (!translating || !url || !path) return
    let active = true
    russianDoc(url).then((doc) => {
      if (active) setRussian(hintText(valueAtPath(doc, path)))
    })
    return () => {
      active = false
    }
  }, [translating, url, path])

  if (!translating || !empty || !russian) return null
  return (
    <div className={styles.root}>
      <span className={styles.label}>По-русски</span>
      <p className={styles.text}>{russian}</p>
    </div>
  )
}
