import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { markMatches, type Suggestion } from '@/domain/suggest.mjs'
import { catalogHref } from '@/lib/navigationHrefs'
import type { SuggestState } from '@/lib/useSuggest'
import { WhatsappIcon } from '../icons/icons'
import styles from './SearchSuggestions.module.css'

/** Строка списка: подсказка или «Все результаты». */
export type SearchOption = { id: string; href: string; suggestion: Suggestion | null }
export type SearchGroup = { key: string; title: string; options: SearchOption[] }

type Props = {
  query: string
  state: SuggestState
  groups: SearchGroup[]
  /** Все строки по порядку показа (для клавиатуры), последней — «Все результаты». */
  options: SearchOption[]
  listId: string
  active: number
  hints: readonly string[]
  whatsappHref: string | null
  onHint: (text: string) => void
  onPick: () => void
  onHover: (index: number) => void
}

const whatsappText = (query: string) =>
  query
    ? `Здравствуйте! Ищу на сайте: ${query}. Подскажите, пожалуйста.`
    : 'Здравствуйте! Подскажите, пожалуйста, что подойдёт под мою задачу: '

/** Вторая строка подсказки: производитель или семейство и тип — серым, мельче. */
function metaOf(suggestion: Suggestion) {
  if (suggestion.type === 'product' || suggestion.type === 'family')
    return [suggestion.note, suggestion.label].filter(Boolean).join(' · ')
  return suggestion.note ?? ''
}

/**
 * Выпадающая область поиска: «Часто ищут» (поле пустое), подсказки по группам, «ничего не
 * нашлось». Ниже спокойная строка «Все результаты» и самая тихая — написать инженеру.
 */
export function SearchSuggestions(props: Props) {
  const { query, state, groups, options, listId, active, hints, whatsappHref } = props
  const result = state.status === 'done' || state.status === 'loading' ? state.result : null
  const nothing = state.status === 'done' && options.length === 0
  const trimmed = query.trim()
  const all = options.find((option) => !option.suggestion)
  const whatsapp = whatsappHref
    ? `${whatsappHref}?text=${encodeURIComponent(whatsappText(trimmed))}`
    : null
  const indexOf = (option: SearchOption) => options.indexOf(option)

  const row = (option: SearchOption, className: string, children: ReactNode) => (
    <Link
      key={option.id}
      id={option.id}
      href={option.href}
      role="option"
      aria-selected={indexOf(option) === active}
      tabIndex={-1}
      className={className}
      onClick={props.onPick}
      onPointerMove={() => props.onHover(indexOf(option))}
    >
      {children}
    </Link>
  )

  return (
    <div className={styles.panel}>
      {state.status === 'idle' && (
        <div className={styles.block}>
          <p className={styles.caption}>Часто ищут</p>
          <div className={styles.chips}>
            {hints.map((hint) => (
              <button
                key={hint}
                type="button"
                className={styles.chip}
                onClick={() => props.onHint(hint)}
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {options.length > 0 && (
        <div id={listId} role="listbox" aria-label="Подсказки поиска" className={styles.list}>
          {groups.map((group) => (
            // biome-ignore lint/a11y/useSemanticElements: группа строк внутри listbox, fieldset тут не подходит
            <div
              key={group.key}
              role="group"
              aria-labelledby={`${listId}-${group.key}`}
              className={styles.group}
            >
              <p id={`${listId}-${group.key}`} className={styles.caption}>
                {group.title}
              </p>
              {group.options.map((option) => {
                const suggestion = option.suggestion
                if (!suggestion) return null
                const meta = metaOf(suggestion)
                return row(
                  option,
                  styles.option,
                  <>
                    <span className={styles.title}>
                      {markMatches(suggestion.title, trimmed).map((part, i) =>
                        part.match ? (
                          // biome-ignore lint/suspicious/noArrayIndexKey: куски одной строки, порядок постоянный
                          <mark key={i} className={styles.mark}>
                            {part.text}
                          </mark>
                        ) : (
                          part.text
                        ),
                      )}
                    </span>
                    {meta && <span className={styles.meta}>{meta}</span>}
                  </>,
                )
              })}
            </div>
          ))}
          {all &&
            row(
              all,
              styles.all,
              <>
                <span>Все результаты по запросу «{trimmed}»</span>
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </>,
            )}
        </div>
      )}

      {state.status === 'loading' && !result && <p className={styles.status}>Ищем…</p>}
      {state.status === 'error' && (
        <p className={styles.status}>
          Подсказки сейчас не загрузились. Нажмите Enter — откроется страница поиска.
        </p>
      )}
      {nothing && (
        <div className={styles.block}>
          <p className={styles.emptyTitle}>По запросу «{trimmed}» ничего не нашлось</p>
          <p className={styles.emptyText}>
            Проверьте написание или откройте{' '}
            <Link href={catalogHref()} onClick={props.onPick}>
              каталог
            </Link>
            .
          </p>
        </div>
      )}

      <p className="visually-hidden" aria-live="polite">
        {state.status === 'done'
          ? nothing
            ? 'Ничего не нашлось'
            : `Подсказок: ${result?.items.length ?? 0}`
          : ''}
      </p>

      {whatsapp && (
        <a href={whatsapp} className={styles.engineer} target="_blank" rel="noreferrer">
          <WhatsappIcon size={16} className={styles.engineerIcon} />
          <span>
            Не нашли нужное? <span className={styles.engineerLink}>Напишите инженеру</span>
          </span>
        </a>
      )}
    </div>
  )
}
