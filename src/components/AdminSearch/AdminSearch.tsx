'use client'

import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { SEARCH_MIN } from '@/domain/adminSearch.mjs'
import { adminCall } from '@/lib/adminCall'
import type { SearchGroup } from '@/lib/adminSearch'
import styles from './AdminSearch.module.css'

/** Пауза после ввода перед запросом — чтобы не искать на каждую букву. */
const DELAY_MS = 250

/**
 * Поиск в меню админки (просьба владельца 30.10.2026): разделы админки и записи — товары,
 * разделы, публикации, база Кадди, заказы и заявки. Результаты ссылками прямо под полем.
 */
export function AdminSearch() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const latest = useRef(0)
  const listId = useId()

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
          className={styles.input}
          type="search"
          value={query}
          placeholder="Поиск: товар, раздел, заказ…"
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
