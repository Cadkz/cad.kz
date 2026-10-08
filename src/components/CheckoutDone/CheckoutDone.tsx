'use client'

import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatDateTime, formatKzt } from '@/lib/format'
import { catalogHref } from '@/lib/navigationHrefs'
import { ButtonLink } from '../Button/Button'
import styles from './CheckoutDone.module.css'

export type DoneOrder = { number: string; totalKzt: string; savedAt: string }

/**
 * Экран после отправки. Честный статус демоверсии: заявка сохранена, но менеджерам не передана.
 * Обещаний вроде «менеджер свяжется» здесь быть не должно.
 */
export function CheckoutDone({ order }: { order: DoneOrder }) {
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => title.current?.focus(), [])
  return (
    <section className={styles.done} aria-labelledby="checkout-done-title">
      <CircleCheck className={styles.icon} size={24} strokeWidth={1.75} aria-hidden="true" />
      <div className={styles.text}>
        <h2 id="checkout-done-title" ref={title} tabIndex={-1} className={styles.title}>
          Заявка сохранена
        </h2>
        <p className={styles.lead} role="status">
          В демоверсии она не передаётся менеджерам.
        </p>
      </div>
      <dl className={styles.facts}>
        <dt>Номер заявки</dt>
        <dd>{order.number}</dd>
        <dt>Сумма с НДС</dt>
        <dd>{formatKzt(order.totalKzt)}</dd>
        <dt>Сохранена</dt>
        <dd>{formatDateTime(order.savedAt)}</dd>
      </dl>
      <ButtonLink href={catalogHref()}>Вернуться в каталог</ButtonLink>
    </section>
  )
}
