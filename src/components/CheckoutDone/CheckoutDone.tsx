'use client'

import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { type CrmState, crmDoneText } from '@/lib/crmNotice'
import { formatDateTime, formatKzt } from '@/lib/format'
import { catalogHref } from '@/lib/navigationHrefs'
import { ButtonLink } from '../Button/Button'
import styles from './CheckoutDone.module.css'

export type DoneOrder = { number: string; totalKzt: string; savedAt: string; crm?: CrmState }

/**
 * Экран после отправки. Честный статус: «менеджер свяжется» — только если заказ ушёл в Битрикс24
 * или стоит в очереди на повтор; в демо без CRM — что менеджерам он не передаётся.
 */
export function CheckoutDone({ order }: { order: DoneOrder }) {
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => title.current?.focus(), [])
  return (
    <section className={styles.done} aria-labelledby="checkout-done-title">
      <CircleCheck className={styles.icon} size={24} strokeWidth={1.75} aria-hidden="true" />
      <div className={styles.text}>
        <h2 id="checkout-done-title" ref={title} tabIndex={-1} className={styles.title}>
          Заказ сохранён
        </h2>
        <p className={styles.lead} role="status">
          {crmDoneText(order.crm)}
        </p>
      </div>
      <dl className={styles.facts}>
        <dt>Номер заказа</dt>
        <dd>{order.number}</dd>
        <dt>Сумма с НДС</dt>
        <dd>{formatKzt(order.totalKzt)}</dd>
        <dt>Сохранён</dt>
        <dd>{formatDateTime(order.savedAt)}</dd>
      </dl>
      <ButtonLink href={catalogHref()}>Вернуться в каталог</ButtonLink>
    </section>
  )
}
