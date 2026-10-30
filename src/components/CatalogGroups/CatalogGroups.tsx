'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { ResultGroup } from '@/lib/catalogFilter'
import { Button } from '../Button/Button'
import { ProductCard } from '../ProductCard/ProductCard'
import { Reveal } from '../Reveal/Reveal'
import styles from './CatalogGroups.module.css'

/**
 * Сколько карточек группы видно сразу; остальные — по кнопке «Показать все». Пять рядов по три:
 * сетка не короче колонки фильтров слева (замечание владельца 29.10.2026, было 6). Остаётся
 * не больше ряда — показываем сразу всё, без кнопки ради одной-трёх карточек.
 */
const FIRST = 15
const TAIL = 3

/**
 * Товары выбранного производителя группами по линейкам: «Программный комплекс»,
 * «Программы-сателлиты». У группы со страницей семейства — ссылка, где можно отметить
 * несколько программ сразу.
 */
export function CatalogGroups({ groups }: { groups: ResultGroup[] }) {
  const [open, setOpen] = useState<string[]>([])
  return (
    <div className={styles.root}>
      {groups.map((group) => {
        const all = open.includes(group.key) || group.items.length <= FIRST + TAIL
        const shown = all ? group.items : group.items.slice(0, FIRST)
        return (
          <section key={group.key} className={styles.group} aria-label={group.title || undefined}>
            {(group.title || group.href) && (
              <div className={styles.head}>
                {group.title && <h2 className={styles.title}>{group.title}</h2>}
                {group.href && (
                  <Link href={group.href} className={styles.family}>
                    Выбрать несколько на одной странице
                    <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}
            <ul className={styles.grid}>
              {shown.map((item, index) => (
                <Reveal as="li" key={item.id} step={index % 3}>
                  <ProductCard product={item} />
                </Reveal>
              ))}
            </ul>
            {!all && (
              <div className={styles.more}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen((keys) => [...keys, group.key])}
                >
                  Показать все ({group.items.length})
                </Button>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
