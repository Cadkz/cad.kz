'use client'

import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useT } from '@/components/LangProvider/LangProvider'
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
  const t = useT()
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => title.current?.focus(), [])
  return (
    <section className={styles.done} aria-labelledby="checkout-done-title">
      <CircleCheck className={styles.icon} size={24} strokeWidth={1.75} aria-hidden="true" />
      <div className={styles.text}>
        <h2 id="checkout-done-title" ref={title} tabIndex={-1} className={styles.title}>
          {t('Заказ сохранён')}
        </h2>
        <p className={styles.lead} role="status">
          {crmDoneText(order.crm)}
        </p>
      </div>
      <dl className={styles.facts}>
        <dt>{t('Номер заказа')}</dt>
        <dd>{order.number}</dd>
        <dt>{t('Сумма с НДС')}</dt>
        {/* Только позиции по запросу: суммы нет, её назовёт менеджер. */}
        <dd>{BigInt(order.totalKzt) > 0n ? formatKzt(order.totalKzt) : t('Назовёт менеджер')}</dd>
        <dt>{t('Сохранён')}</dt>
        <dd>{formatDateTime(order.savedAt, t.lang)}</dd>
      </dl>
      <ButtonLink href={catalogHref()}>{t('Вернуться в каталог')}</ButtonLink>
    </section>
  )
}
