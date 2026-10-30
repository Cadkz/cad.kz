'use client'

import { useNav } from '@payloadcms/ui'
import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { isSearchHotkey, OPEN_ADMIN_SEARCH, SEARCH_MIN } from '@/domain/adminSearch.mjs'
import { adminCall } from '@/lib/adminCall'
import type { SearchGroup } from '@/lib/adminSearch'
import styles from './AdminSearch.module.css'

/** Пауза после ввода перед запросом — чтобы не искать на каждую букву. */
const DELAY_MS = 250
/** Меню на телефоне выезжает с анимацией: курсор ставим, когда поле уже видно. */
const NAV_OPEN_MS = 300

/**
 * Поиск в меню админки (просьба владельца 30.10.2026): команды («новость», «прайс», «без цены»),
 * разделы админки и записи — товары, разделы, публикации, база Кадди, заказы и заявки.
 * Результаты ссылками прямо под полем. «/», Ctrl+K и лупа в шапке — сразу в поиск.
 */
export function AdminSearch() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const latest = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const nav = useNav()
  const { setNavOpen } = nav
  // Открыто ли меню — в ref, чтобы не переподписывать клавиши при каждом открытии меню.
  const navOpen = useRef(nav.navOpen)
  navOpen.current = nav.navOpen

  // «/» или Ctrl+K (на Mac — Cmd+K) из любого места админки и лупа в шапке ставят курсор в поиск.
  // На телефоне меню закрыто — сначала открываем его, потом ставим курсор.
  useEffect(() => {
    const open = () => {
      const wasOpen = navOpen.current
      if (!wasOpen) setNavOpen(true)
      window.setTimeout(
        () => {
          input.current?.focus()
          input.current?.select()
        },
        wasOpen ? 0 : NAV_OPEN_MS,
      )
    }
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const richText = Boolean(target?.isContentEditable || target?.closest('textarea'))
      const typing =
        richText || Boolean(target?.closest('input, select, [role="combobox"], [role="textbox"]'))
      if (!isSearchHotkey(event, { typing, richText: richText && target !== input.current })) return
      event.preventDefault()
      open()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_ADMIN_SEARCH, open)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_ADMIN_SEARCH, open)
    }
  }, [setNavOpen])

  useEffect(() => {
    const text = query.trim()
    if (text.length < SEARCH_MIN) {
      setGroups(null)
      setError('')
      return
    }
    const ticket = ++latest.current
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await adminCall<{ groups: SearchGroup[] }>('/api/admin/search', {
          query: text,
        })
        if (ticket === latest.current) {
          setGroups(data.groups)
          setError('')
        }
      } catch (caught) {
        if (ticket === latest.current)
          setError(caught instanceof Error ? caught.message : 'Поиск не сработал')
      } finally {
        if (ticket === latest.current) setLoading(false)
      }
    }, DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <search className={styles.root}>
      <label className={styles.field}>
        <Search size={16} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
        <span className={styles.hidden}>Поиск по админке</span>
        <input
          ref={input}
          className={styles.input}
          type="search"
          value={query}
          placeholder="Поиск или команда · нажмите /"
          aria-controls={listId}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setQuery('')
          }}
        />
      </label>
      <div id={listId} aria-live="polite">
        {loading && !groups && <p className={styles.status}>Ищу…</p>}
        {error && <p className={styles.status}>{error}</p>}
        {groups && !groups.length && !error && <p className={styles.status}>Ничего не нашлось</p>}
        {groups?.map((group) => (
          <div key={group.label} className={styles.group}>
            <p className={styles.groupTitle}>{group.label}</p>
            {group.hits.map((hit) => (
              <a key={hit.href} className={styles.hit} href={hit.href}>
                <span>{hit.label}</span>
                {hit.note && <span className={styles.note}>{hit.note}</span>}
              </a>
            ))}
          </div>
        ))}
      </div>
    </search>
  )
}
