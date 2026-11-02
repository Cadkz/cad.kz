import { ArrowRight } from 'lucide-react'
import { positions } from '@/lib/plural'
import { ButtonLink } from '../Button/Button'
import styles from './CatalogShowcaseMore.module.css'

type Props = {
  /** Адрес страницы каталога с теми же условиями, что выбраны на главной. */
  href: string
  /** Сколько товаров по условиям; нет — шаг выбора (производители, разделы). */
  total: number | null
  /** Показаны не все: подпись говорит, сколько ещё в каталоге. */
  shown: number
}

/**
 * Низ каталога на главной вместо номеров страниц (правка владельца 02.11.2026): тёмно-синяя
 * кнопка «Перейти в каталог» с теми же условиями и подпись, сколько там товаров.
 */
export function CatalogShowcaseMore({ href, total, shown }: Props) {
  const rest = total !== null && total > shown
  return (
    <div className={styles.root}>
      {rest && (
        <p className={styles.note}>
          Показано {shown} из {positions(total)}
        </p>
      )}
      <ButtonLink href={href}>
        Перейти в каталог
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </ButtonLink>
    </div>
  )
}
