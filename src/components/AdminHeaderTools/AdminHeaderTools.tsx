'use client'

import { useTheme } from '@payloadcms/ui'
import { Moon, Search, Sun } from 'lucide-react'
import { OPEN_ADMIN_SEARCH } from '@/domain/adminSearch.mjs'
import styles from './AdminHeaderTools.module.css'

/**
 * Кнопки в шапке админки, справа (пожелание владельца 30.10.2026): лупа открывает поиск в меню,
 * солнце / луна переключает светлую и тёмную тему. Тему хранит Payload (cookie на год) — та же
 * настройка, что в «Аккаунте».
 */
export function AdminHeaderTools() {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  const themeLabel = dark ? 'Светлая тема' : 'Тёмная тема'
  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.button}
        title="Поиск по админке ( / )"
        aria-label="Поиск по админке"
        onClick={() => window.dispatchEvent(new Event(OPEN_ADMIN_SEARCH))}
      >
        <Search size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.button}
        title={themeLabel}
        aria-label={themeLabel}
        onClick={() => setTheme(dark ? 'light' : 'dark')}
      >
        {dark ? (
          <Sun size={20} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Moon size={20} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
