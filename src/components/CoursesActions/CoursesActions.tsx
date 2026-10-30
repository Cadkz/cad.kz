'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { adminCall } from '@/lib/adminCall'
import styles from './CoursesActions.module.css'

type Extra = { id: number; title: string }
type PriceDiff = { id: number; title: string; site: string; table: string }
type Props = { extra: Extra[]; prices: PriceDiff[]; ready: boolean }
type Result = { message: string }

/** Отмеченные ID: по умолчанию отмечено всё. */
function useChecks(ids: number[]) {
  const [off, setOff] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  return { checked: ids.filter((id) => !off.has(id)), isOn: (id: number) => !off.has(id), toggle }
}

/**
 * Действия сверки курсов: скрыть с сайта курсы, которых нет в расписании (в черновики — вернуть
 * можно «Активностью» в каталоге), и взять цены из таблицы. Всё отмечено — снять лишнее галочкой.
 */
export function CoursesActions({ extra, prices, ready }: Props) {
  const router = useRouter()
  const hide = useChecks(extra.map((c) => c.id))
  const price = useChecks(prices.map((c) => c.id))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function run(action: 'hide' | 'prices', ids: number[]) {
    setBusy(true)
    setResult('')
    setError('')
    try {
      const reply = await adminCall<Result>('/api/admin/courses', { action, ids })
      setResult(reply.message)
      router.refresh()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не получилось. Повторите.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="courses-extra">
        <h2 id="courses-extra">Нет в расписании: {extra.length}</h2>
        <p className={styles.note}>
          На сайте есть, в таблице УЦ нет. Отмеченные уйдут в черновики (с сайта пропадут, вернуть —
          «Каталог» → «Активность» → «Да»). Курс нужен, но называется иначе — снимите галочку и
          впишите название из таблицы в «Другие названия».
        </p>
        {extra.length > 0 && (
          <>
            <ul className={styles.list}>
              {extra.map((course) => (
                <li key={course.id}>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={hide.isOn(course.id)}
                      onChange={() => hide.toggle(course.id)}
                    />
                    <a href={`/admin/collections/products/${course.id}`}>{course.title}</a>
                  </label>
                </li>
              ))}
            </ul>
            <AdminButton
              onClick={() => run('hide', hide.checked)}
              disabled={busy || !ready || !hide.checked.length}
            >
              Скрыть отмеченные ({hide.checked.length})
            </AdminButton>
          </>
        )}
      </section>
      <section className={styles.section} aria-labelledby="courses-prices">
        <h2 id="courses-prices">Цена расходится: {prices.length}</h2>
        <p className={styles.note}>
          Цена на сайте не такая, как в таблице УЦ (на сайте — вниз до тысячи). Отмеченным курсам
          цена станет как в таблице.
        </p>
        {prices.length > 0 && (
          <>
            <ul className={styles.list}>
              {prices.map((course) => (
                <li key={course.id}>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={price.isOn(course.id)}
                      onChange={() => price.toggle(course.id)}
                    />
                    <a href={`/admin/collections/products/${course.id}`}>{course.title}</a>
                    <span className={styles.muted}>
                      {course.site} → {course.table}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <AdminButton
              onClick={() => run('prices', price.checked)}
              disabled={busy || !ready || !price.checked.length}
            >
              Взять цены из таблицы ({price.checked.length})
            </AdminButton>
          </>
        )}
      </section>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className={styles.ok} role="status">
          {result}
        </p>
      )}
    </>
  )
}
