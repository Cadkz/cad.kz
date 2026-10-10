'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import { groupSuggestions } from '@/domain/suggest.mjs'
import { useSuggest } from '@/lib/useSuggest'
import { useTypingHint } from '@/lib/useTypingHint'
import {
  type SearchGroup,
  type SearchOption,
  SearchSuggestions,
} from '../SearchSuggestions/SearchSuggestions'
import styles from './SearchBox.module.css'

type Props = {
  /** inline — поле в шапке, подсказки выпадают под ним; layer — поиск на весь экран телефона. */
  variant: 'inline' | 'layer'
  hints: readonly string[]
  typingHints: readonly string[]
  whatsappHref: string | null
  onClose?: () => void
}

const searchHref = (query: string) => `/search?q=${encodeURIComponent(query.trim())}`

/**
 * Поле поиска с подсказками (комбобокс): стрелки выбирают строку, Enter открывает её или страницу
 * всех результатов, Escape закрывает. Без скриптов — обычная форма на страницу поиска.
 */
export function SearchBox({ variant, hints, typingHints, whatsappHref, onClose }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const hint = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(variant === 'layer')
  // Человек уже работал с поиском — примеры больше не печатаются.
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(variant === 'layer')
  const [active, setActive] = useState(-1)
  const state = useSuggest(value)

  const { groups, options } = useMemo(() => {
    const result = state.status === 'done' || state.status === 'loading' ? state.result : null
    if (!result) return { groups: [] as SearchGroup[], options: [] as SearchOption[] }
    let n = 0
    const groups: SearchGroup[] = groupSuggestions(result.items).map((group) => ({
      key: group.key,
      title: group.title,
      options: group.items.map((suggestion) => ({
        id: `${listId}-${n++}`,
        href: suggestion.href,
        suggestion,
      })),
    }))
    const options = groups.flatMap((group) => group.options)
    const products = result.items.some((s) => s.type === 'product' || s.type === 'family')
    if (result.more || products)
      options.push({ id: `${listId}-all`, href: searchHref(result.query), suggestion: null })
    return { groups, options }
  }, [state, listId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: новый набор подсказок — выбор сначала
  useEffect(() => setActive(-1), [options])
  // biome-ignore lint/correctness/useExhaustiveDependencies: перешли на другую страницу — список закрыт
  useEffect(() => {
    if (variant === 'inline') setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (variant === 'layer') input.current?.focus()
  }, [variant])

  useTypingHint(hint, typingHints, variant === 'inline' && !touched && !focused && !value)

  const showPanel = open && (variant === 'layer' || focused || value.trim().length > 0)

  function close() {
    setOpen(false)
    setActive(-1)
    onClose?.()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = options.length
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (!count) return
      const shift = event.key === 'ArrowDown' ? 1 : -1
      const next = active < 0 && shift < 0 ? count - 1 : (active + shift + count) % count
      setActive(next)
      document.getElementById(options[next]?.id ?? '')?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      const option = options[active]
      if (option) {
        event.preventDefault()
        router.push(option.href)
        input.current?.blur()
        close()
      }
    } else if (event.key === 'Escape') {
      // Браузер сам стирает текст поля type="search" по Escape — не даём: Escape только закрывает.
      event.preventDefault()
      if (variant === 'layer' || !open) {
        if (variant === 'inline') input.current?.blur()
        close()
      } else setOpen(false)
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: обёртка только следит, ушёл ли фокус из поиска; управление — в поле
    <div
      ref={root}
      className={`${styles.root} ${styles[variant]}`}
      onBlur={(event) => {
        if (root.current?.contains(event.relatedTarget as Node | null)) return
        setFocused(false)
        if (variant === 'inline') setOpen(false)
      }}
    >
      <search className={styles.row}>
        <form
          action="/search"
          className={styles.field}
          data-hint={variant === 'inline' && !touched && !focused && !value}
          onSubmit={(event) => {
            event.preventDefault()
            if (!value.trim()) return
            router.push(searchHref(value))
            input.current?.blur()
            close()
          }}
        >
          <Search size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
          <span ref={hint} className={styles.hint} aria-hidden="true" />
          <input
            ref={input}
            type="search"
            name="q"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setFocused(true)
              setTouched(true)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
            className={styles.input}
            placeholder="Поиск по каталогу"
            aria-label="Поиск по каталогу"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showPanel && options.length > 0}
            aria-controls={listId}
            aria-activedescendant={showPanel ? options[active]?.id : undefined}
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
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </form>
        {variant === 'layer' && (
          <button type="button" className={styles.cancel} onClick={close}>
            Закрыть
          </button>
        )}
      </search>
      {/* Панель всегда в разметке: и появление, и исчезновение плавные. Нажатие в ней не забирает
          фокус у поля, иначе на Safari список закрылся бы до клика. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: не действие, а удержание фокуса в поле */}
      <div
        className={styles.dropdown}
        data-open={showPanel}
        inert={!showPanel}
        onMouseDown={(event) => event.preventDefault()}
      >
        <SearchSuggestions
          query={value}
          state={state}
          groups={groups}
          options={options}
          listId={listId}
          active={showPanel ? active : -1}
          hints={hints}
          whatsappHref={whatsappHref}
          onHint={(text) => {
            setValue(text)
            input.current?.focus()
          }}
          onPick={close}
          onHover={setActive}
        />
      </div>
    </div>
  )
}
