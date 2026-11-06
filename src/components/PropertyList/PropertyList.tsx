import { groupSpecs } from '@/domain/specs.mjs'
import { getT } from '@/i18n/server'
import type { Spec } from '@/lib/product'
import styles from './PropertyList.module.css'

/**
 * Характеристики товара: две колонки «название — значение» от 640 px. Если у характеристик есть
 * группы (исследование оборудования: «Печать», «Сканирование»…), группа — подзаголовком, а не
 * повтором в каждом названии («Точность — Точность 3D», замечание владельца 23.10.2026).
 */
export async function PropertyList({ items }: { items: Spec[] }) {
  const t = await getT()
  const groups = groupSpecs(items)
  return (
    <div className={styles.groups}>
      {groups.map(({ group, items: rows }) => (
        <section key={group ?? ''} className={styles.group}>
          {group && <h3 className={styles.title}>{group}</h3>}
          <dl className={styles.list}>
            {rows.map((item) => (
              <div key={item.name} className={styles.row}>
                <dt className={styles.name}>{t(item.name)}</dt>
                <dd className={styles.value}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
