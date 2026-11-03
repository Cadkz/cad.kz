import { Check } from 'lucide-react'
import type { MenuVendor } from '@/lib/navigation'
import styles from './MenuChips.module.css'

type Props = {
  vendors: MenuVendor[]
  /** Выбранный производитель или null — тогда под чипами «Популярное». */
  selected: string | null
  onSelect: (key: string | null) => void
}

/**
 * Производители направления облачками в строку (правка владельца 03.11.2026, 12:00): без
 * логотипов — в 20 px их не разобрать, — по алфавиту, чтобы порядок читался сам. Выбранный
 * — тёмно-синий с белым текстом и галочкой. Нажатие выбирает производителя, повторное — снимает выбор.
 */
export function MenuChips({ vendors, selected, onSelect }: Props) {
  const sorted = [...vendors].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  return (
    <div className={styles.root}>
      <p className={styles.label}>Производители</p>
      <ul className={styles.chips} aria-label="Производители">
        {sorted.map((vendor) => {
          const active = vendor.key === selected
          return (
            <li key={vendor.key}>
              <button
                type="button"
                className={styles.chip}
                aria-pressed={active}
                onClick={() => onSelect(active ? null : vendor.key)}
              >
                {active && <Check size={16} strokeWidth={1.75} aria-hidden="true" />}
                {vendor.title}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
