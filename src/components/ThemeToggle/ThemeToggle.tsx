'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/domain/siteTheme.mjs'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import styles from './ThemeToggle.module.css'

/** Значок выбирается CSS до гидратации; кнопка не теряет фокус при смене темы. */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null)
  useEffect(() => {
    setDark(document.documentElement.dataset.siteTheme === 'dark')
    const sync = () => {
      let preference: string | null = null
      try {
        preference = localStorage.getItem(THEME_STORAGE_KEY)
      } catch {}
      const nextDark = preference === 'dark'
      document.documentElement.dataset.siteTheme = nextDark ? 'dark' : 'light'
      setDark(nextDark)
    }
    const storage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) sync()
    }
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener('storage', storage)
    }
  }, [])
  const toggle = () => {
    const root = document.documentElement
    const next = root.dataset.siteTheme === 'dark' ? 'light' : 'dark'
    root.dataset.siteTheme = next
    setDark(next === 'dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {}
  }
  const label =
    dark === null ? 'Переключить тему' : dark ? 'Включить светлую тему' : 'Включить тёмную тему'
  return (
    <HeaderAction
      icon={
        <>
          <Moon className={styles.moon} size={20} strokeWidth={1.75} />
          <Sun className={styles.sun} size={20} strokeWidth={1.75} />
        </>
      }
      ariaLabel={label}
      title={label}
      onClick={toggle}
    />
  )
}
