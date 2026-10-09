'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import styles from './SearchForm.module.css'

/**
 * Поле поиска. Работает и без скриптов (обычная форма с ?q=), а со скриптами результаты
 * обновляются по ходу набора, через полсекунды после последней буквы.
 */
export function SearchForm({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initial) input.current?.focus()
  }, [initial])

  useEffect(() => {
    if (value.trim() === initial.trim()) return
    const timer = setTimeout(() => {
      const q = value.trim()
      startTransition(() =>
        router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }),
      )
    }, 500)
    return () => clearTimeout(timer)
  }, [value, initial, pathname, router])

  return (
    <search>
      <form action="/search" className={styles.form} data-pending={pending}>
        <Search size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
        <input
          ref={input}
          type="search"
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={styles.input}
          placeholder="Например: Автокад, Revit, сканер, расчёт конструкций"
          aria-label="Что ищете"
          autoComplete="off"
          maxLength={100}
          enterKeyHint="search"
        />
        {value && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Очистить"
            onClick={() => {
              setValue('')
              input.current?.focus()
            }}
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
        <button type="submit" className={styles.submit}>
          Найти
        </button>
      </form>
    </search>
  )
}
