'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { FilterState } from '@/lib/catalogFilter'
import { useT } from '../LangProvider/LangProvider'
import styles from './FilterToggle.module.css'

/** Сколько условий выбрано: характеристики, производители, задачи — число на кнопке. */
export function activeCount(state: FilterState): number {
  const features = Object.values(state.features).reduce((sum, values) => sum + values.length, 0)
  return features + state.vendors.length + state.tasks.length
}

/**
 * Кнопка «Фильтры» над каталогом (от 960 px): раскрывает и прячет колонку фильтра слева.
 * Значок панели меняется с поворотом (открыть ↔ закрыть), выбранные условия — числом на кнопке.
 * Открыто — подсветка, как у выбранной вкладки.
 */
export function FilterToggle({
  open,
  count,
  onClick,
}: {
  open: boolean
  count: number
  onClick: () => void
}) {
  const t = useT()
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-expanded={open}
      onClick={onClick}
      title={t(open ? 'Скрыть фильтры' : 'Показать фильтры')}
    >
      <span className={styles.icons} aria-hidden="true">
        <PanelLeftOpen size={16} strokeWidth={1.75} className={styles.openIcon} />
        <PanelLeftClose size={16} strokeWidth={1.75} className={styles.closeIcon} />
      </span>
      {t('Фильтры')}
      {count > 0 && (
        <span className={styles.count} key={count}>
          {count}
        </span>
      )}
    </button>
  )
}
