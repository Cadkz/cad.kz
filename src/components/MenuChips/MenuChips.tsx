import Image from 'next/image'
import type { MenuVendor } from '@/lib/navigation'
import styles from './MenuChips.module.css'

type Props = {
  vendors: MenuVendor[]
  /** Выбранный производитель или null — тогда под чипами «Популярное». */
  selected: string | null
  onSelect: (key: string | null) => void
}

/**
 * Производители направления строкой чипов, по 3 в ряд (правка владельца 03.11.2026: «как фильтр
 * по крошкам», карточка вдвое ниже). Нажатие выбирает производителя, повторное — снимает выбор.
 */
export function MenuChips({ vendors, selected, onSelect }: Props) {
  return (
    <ul className={styles.chips} aria-label="Производители">
      {vendors.map((vendor) => {
        const active = vendor.key === selected
        return (
          <li key={vendor.key}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={active}
              onClick={() => onSelect(active ? null : vendor.key)}
            >
              {vendor.logo && (
                <span className={styles.mark} aria-hidden="true">
                  <Image
                    src={vendor.logo.url}
                    alt=""
                    width={vendor.logo.width}
                    height={vendor.logo.height}
                    sizes="20px"
                    unoptimized={vendor.logo.local}
                    className={styles.logo}
                  />
                </span>
              )}
              <span className={styles.title}>{vendor.title}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
