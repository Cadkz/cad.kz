import {
  ArrowRight,
  Building2,
  FileText,
  GraduationCap,
  LayoutGrid,
  type LucideIcon,
  Package,
  Puzzle,
} from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'
import Link from '@/components/LangLink/LangLink'
import { showVendorLine } from '@/domain/cardNoise.mjs'
import { markMatches, type Suggestion } from '@/domain/suggest.mjs'
import styles from './SearchGroups.module.css'

/** Строка списка: подсказка или «Все результаты». */
export type SearchOption = { id: string; href: string; suggestion: Suggestion | null }
export type SearchGroup = { key: string; title: string; options: SearchOption[] }

type Props = {
  query: string
  groups: SearchGroup[]
  /** Все строки по порядку показа (для клавиатуры), последней — «Все результаты». */
  options: SearchOption[]
  listId: string
  active: number
  onPick: () => void
  onHover: (index: number) => void
}

/** Значок у подписи группы и у строки без логотипа. */
const GROUP_ICON: Record<string, LucideIcon> = {
  products: Package,
  addons: Puzzle,
  courses: GraduationCap,
  vendors: Building2,
  sections: LayoutGrid,
  pages: FileText,
}

/**
 * Вторая строка подсказки — серым, мельче: производитель или семейство. Без повторов: тип
 * («Программа», «Курс») уже сказан подписью группы, производитель в начале названия —
 * самим названием. У семейства — «Семейство программ».
 */
function metaOf(suggestion: Suggestion) {
  if (suggestion.type === 'family') return suggestion.label
  const note = suggestion.note
  if (suggestion.type === 'product')
    return note && showVendorLine(note, suggestion.title) ? note : ''
  return note ?? ''
}

/**
 * Подсказки группами, как в мегаменю (замечание владельца 03.11.2026): слева «Товары» — сами
 * программы и коллекции, справа отдельными блоками дополнения и плагины, обучение, производитель
 * и разделы. В узкой панели — те же блоки друг под другом. Порядок строк для клавиатуры —
 * слева направо, сверху вниз.
 */
export function SearchGroups({ query, groups, options, listId, active, onPick, onHover }: Props) {
  const trimmed = query.trim()
  const all = options.find((option) => !option.suggestion)
  const main = groups.filter((group) => group.key === 'products')
  const side = groups.filter((group) => group.key !== 'products')
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
      onClick={onPick}
      onPointerMove={() => onHover(indexOf(option))}
    >
      {children}
    </Link>
  )

  const block = (group: SearchGroup) => {
    const Icon = GROUP_ICON[group.key] ?? Package
    return (
      // biome-ignore lint/a11y/useSemanticElements: группа строк внутри listbox, fieldset тут не подходит
      <div
        key={group.key}
        role="group"
        aria-labelledby={`${listId}-${group.key}`}
        className={styles.group}
      >
        <p id={`${listId}-${group.key}`} className={styles.caption}>
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
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
              <span className={styles.mark} aria-hidden="true">
                {suggestion.logo ? (
                  // Логотипы — маленькие файлы из public: без оптимизатора, чтобы не ждать его на каждую букву.
                  <Image src={suggestion.logo} alt="" width={32} height={32} unoptimized />
                ) : (
                  <Icon size={20} strokeWidth={1.75} />
                )}
              </span>
              <span className={styles.text}>
                <span className={styles.title}>
                  {markMatches(suggestion.title, trimmed).map((part, i) =>
                    part.match ? (
                      // biome-ignore lint/suspicious/noArrayIndexKey: куски одной строки, порядок постоянный
                      <mark key={i} className={styles.hit}>
                        {part.text}
                      </mark>
                    ) : (
                      part.text
                    ),
                  )}
                </span>
                {meta && <span className={styles.meta}>{meta}</span>}
              </span>
            </>,
          )
        })}
      </div>
    )
  }

  return (
    <div id={listId} role="listbox" aria-label="Подсказки поиска" className={styles.list}>
      <div className={styles.columns} data-split={main.length > 0 && side.length > 0}>
        {main.length > 0 && <div className={styles.main}>{main.map(block)}</div>}
        {side.length > 0 && <div className={styles.side}>{side.map(block)}</div>}
      </div>
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
  )
}
