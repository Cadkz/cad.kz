'use client'

import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useT } from '../LangProvider/LangProvider'
import styles from './FilterRail.module.css'

/**
 * Свёрнутый фильтр каталога (от 960 px), вариант B «Направляющая» (07.11.2026): вместо широкой
 * полосы — небольшая круглая кнопка (32 px) по центру со значком, под ней тонкая линия во всю высоту карточек. Наведение:
 * линия прорисовывается сверху вниз синим в голубой, справа выезжает подпись «Фильтры ›».
 * При прокрутке кнопка держится посередине видимой части полосы; есть выбранные условия — точка на значке.
 */
export function FilterRail({
  hidden,
  count,
  onOpen,
  className,
}: {
  hidden: boolean
  count: number
  onOpen: () => void
  className?: string
}) {
  const t = useT()
  return (
    <button
      type="button"
      className={[styles.rail, className].filter(Boolean).join(' ')}
      onClick={onOpen}
      aria-expanded={false}
      aria-label={t('Показать фильтры')}
      hidden={hidden}
    >
      <span className={styles.stick}>
        <span className={styles.knob}>
          <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
          {count > 0 && <span className={styles.dot} />}
        </span>
        <span className={styles.tip} aria-hidden="true">
          {t('Фильтры')}
          <ChevronRight size={16} strokeWidth={1.75} />
        </span>
      </span>
    </button>
  )
}
