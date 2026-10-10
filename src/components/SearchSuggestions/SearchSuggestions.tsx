import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Suggestion } from '@/domain/suggest.mjs'
import { catalogHref } from '@/lib/navigationHrefs'
import type { SuggestState } from '@/lib/useSuggest'
import { WhatsappIcon } from '../icons/icons'
import styles from './SearchSuggestions.module.css'

/** Строка списка: подсказка или «Все результаты». */
export type SearchOption = { id: string; href: string; suggestion: Suggestion | null }

type Props = {
  query: string
  state: SuggestState
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

/**
 * Выпадающая область поиска: примеры запросов (поле пустое), подсказки, «ничего не нашлось».
 * Внизу всегда выход к человеку — написать задачу инженеру в WhatsApp.
 */
export function SearchSuggestions(props: Props) {
  const { query, state, options, listId, active, hints, whatsappHref } = props
  const result = state.status === 'done' || state.status === 'loading' ? state.result : null
  const nothing = state.status === 'done' && options.length === 0
  const whatsapp = whatsappHref
    ? `${whatsappHref}?text=${encodeURIComponent(whatsappText(query.trim()))}`
    : null

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
        // biome-ignore lint/a11y/useSemanticElements: список подсказок поля-комбобокса, не выбор из select
        <div id={listId} role="listbox" aria-label="Подсказки поиска" className={styles.list}>
          {options.map((option, index) => (
            <Link
              key={option.id}
              id={option.id}
              href={option.href}
              role="option"
              aria-selected={index === active}
              tabIndex={-1}
              className={option.suggestion ? styles.option : styles.all}
              onClick={props.onPick}
              onPointerMove={() => props.onHover(index)}
            >
              {option.suggestion ? (
                <>
                  <span className={styles.title}>{option.suggestion.title}</span>
                  <span className={styles.meta}>
                    <span className={styles.label}>{option.suggestion.label}</span>
                    {option.suggestion.note && (
                      <span className={styles.note}>{option.suggestion.note}</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  Все результаты по запросу «{query.trim()}»
                  <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </>
              )}
            </Link>
          ))}
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
          <p className={styles.emptyTitle}>По запросу «{query.trim()}» ничего не нашлось</p>
          <p className={styles.status}>
            Проверьте написание или посмотрите{' '}
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
          <WhatsappIcon size={20} />
          <span>
            Не нашли нужное? <strong>Напишите задачу инженеру</strong>
          </span>
        </a>
      )}
    </div>
  )
}
