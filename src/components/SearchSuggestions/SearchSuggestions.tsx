import Link from '@/components/LangLink/LangLink'
import { catalogHref } from '@/lib/navigationHrefs'
import type { SuggestState } from '@/lib/useSuggest'
import { WhatsappIcon } from '../icons/icons'
import { type SearchGroup, SearchGroups, type SearchOption } from '../SearchGroups/SearchGroups'
import { SearchKaddi } from '../SearchKaddi/SearchKaddi'
import styles from './SearchSuggestions.module.css'

export type { SearchGroup, SearchOption }

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

/**
 * Выпадающая область поиска: «Часто ищут» (поле пустое), подсказки по группам, «ничего не
 * нашлось». Ниже спокойная строка «Все результаты», мини-Кадди (вопрос своими словами — в чат, когда
 * консультант работает; ничего не нашлось — Кадди с лупой) и самая тихая — написать нам в WhatsApp.
 */
export function SearchSuggestions(props: Props) {
  const { query, state, groups, options, listId, active, hints, whatsappHref } = props
  const result = state.status === 'done' || state.status === 'loading' ? state.result : null
  const nothing = state.status === 'done' && options.length === 0
  const trimmed = query.trim()
  const whatsapp = whatsappHref
    ? `${whatsappHref}?text=${encodeURIComponent(whatsappText(trimmed))}`
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
        <SearchGroups
          query={query}
          groups={groups}
          options={options}
          listId={listId}
          active={active}
          onPick={props.onPick}
          onHover={props.onHover}
        />
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

      {state.status !== 'loading' && (
        <SearchKaddi query={trimmed} empty={nothing} onPick={props.onPick} />
      )}

      {whatsapp && (
        <a href={whatsapp} className={styles.engineer} target="_blank" rel="noreferrer">
          <WhatsappIcon size={16} className={styles.engineerIcon} />
          <span>
            Не нашли нужное? <span className={styles.engineerLink}>Напишите нам</span>
          </span>
        </a>
      )}
    </div>
  )
}
