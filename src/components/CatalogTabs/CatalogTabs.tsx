'use client'

import { useT } from '@/components/LangProvider/LangProvider'
import { GROUP_LABELS, POPULAR_LABEL } from '@/domain/catalogNavigation.mjs'
import type { CatalogGroup } from '@/lib/catalog'
import { type FilterState, POPULAR } from '@/lib/catalogFilter'
import { Chip } from '../Chip/Chip'
import styles from './CatalogTabs.module.css'

type Props = {
  selected: FilterState['group']
  groups: CatalogGroup[]
  hasPopular: boolean
  onChange: (change: Partial<FilterState>) => void
  /** row — одной строкой над карточками (каталог на главной), иначе — переносами в панели фильтра. */
  row?: boolean
}

/** Вкладки каталога в том же порядке и с теми же названиями, что в меню «Каталог». */
export function CatalogTabs({ selected, groups, hasPopular, onChange, row = false }: Props) {
  const t = useT()
  return (
    <fieldset className={row ? `${styles.tabs} ${styles.row}` : styles.tabs}>
      <legend className="visually-hidden">{t('Группа каталога')}</legend>
      <Chip soft selected={selected === null} onClick={() => onChange({ group: null })}>
        {t('Все')}
      </Chip>
      {hasPopular && (
        <Chip soft selected={selected === POPULAR} onClick={() => onChange({ group: POPULAR })}>
          {t(POPULAR_LABEL)}
        </Chip>
      )}
      {groups.map((group) => (
        <Chip key={group} selected={selected === group} onClick={() => onChange({ group })}>
          {t(GROUP_LABELS[group])}
        </Chip>
      ))}
    </fieldset>
  )
}
