'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { adminCall } from '@/lib/adminCall'
import styles from './CoursePages.module.css'

type Page = { id: number; title: string; link: string }
type Props = { pages: Page[]; ready: boolean }
type Batch = { done: string[]; failed: string[]; doneIds: number[]; failedIds: number[] }
type Outcome = { done: number; failed: string[] }

/** Столько курсов в одном запросе — столько же принимает сервер (/api/admin/courses). */
const BATCH = 3

/**
 * Описания курсов со страниц l-p.kz. Браузер отправляет отмеченные курсы порциями по три и
 * показывает ход работы: одним запросом 36 курсов не укладывались в минуту, которую Vercel даёт
 * серверу (замечание владельца 31.10.2026). Порция не прошла — её курсы попадают в «Не получилось»,
 * остальные идут дальше. После работы отмеченными остаются только неудачные — «Повторить».
 */
export function CoursePages({ pages, ready }: Props) {
  const router = useRouter()
  const [off, setOff] = useState<Set<number>>(new Set())
  const checked = pages.map((p) => p.id).filter((id) => !off.has(id))
  const [progress, setProgress] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const titles = new Map(pages.map((p) => [p.id, p.title]))

  function toggle(id: number) {
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function run() {
    const ids = checked
    const failed: string[] = []
    const failedIds: number[] = []
    let done = 0
    setOutcome(null)
    setProgress(0)
    for (let start = 0; start < ids.length; start += BATCH) {
      const part = ids.slice(start, start + BATCH)
      try {
        const reply = await adminCall<Batch>('/api/admin/courses', {
          action: 'descriptions',
          ids: part,
        })
        done += reply.doneIds.length
        failed.push(...reply.failed)
        failedIds.push(...reply.failedIds)
      } catch (failure) {
        const reason = failure instanceof Error ? failure.message : 'сервер не ответил'
        for (const id of part) {
          failed.push(`${titles.get(id) ?? id} — ${reason}`)
          failedIds.push(id)
        }
      }
      setProgress(Math.min(start + BATCH, ids.length))
    }
    setOff(new Set(pages.map((p) => p.id).filter((id) => !failedIds.includes(id))))
    setOutcome({ done, failed })
    setProgress(null)
    router.refresh()
  }

  const busy = progress !== null
  const retry = outcome !== null && outcome.failed.length > 0

  return (
    <section className={styles.section} aria-labelledby="courses-pages">
      <h2 id="courses-pages">Описания с l-p.kz: {pages.length}</h2>
      <p className={styles.note}>
        Курсы, у которых в таблице есть ссылка «Программа курса». Сайт откроет страницы l-p.kz и
        заменит описание отмеченных курсов текстом оттуда (с программой по модулям). «Коротко для
        карточки» заполнится, только если оно пустое. Курсы идут по три, ход работы виден на кнопке.
      </p>
      {pages.length > 0 && (
        <>
          <ul className={styles.list}>
            {pages.map((course) => (
              <li key={course.id}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={!off.has(course.id)}
                    onChange={() => toggle(course.id)}
                    disabled={busy}
                  />
                  <a href={`/admin/collections/products/${course.id}`}>{course.title}</a>
                  <a className={styles.muted} href={course.link} target="_blank" rel="noreferrer">
                    l-p.kz
                  </a>
                </label>
              </li>
            ))}
          </ul>
          <AdminButton onClick={run} disabled={busy || !ready || !checked.length}>
            {busy
              ? `Читаю страницы: ${progress} из ${checked.length}…`
              : retry
                ? `Повторить для не получившихся (${checked.length})`
                : `Обновить описания (${checked.length})`}
          </AdminButton>
        </>
      )}
      {outcome && outcome.done > 0 && (
        <p className={styles.ok} role="status">
          Описания обновлены у курсов: {outcome.done}.
        </p>
      )}
      {outcome && outcome.failed.length > 0 && (
        <div className={styles.error} role="alert">
          <p>Не получилось ({outcome.failed.length}) — отмечены, можно повторить:</p>
          <ul>
            {outcome.failed.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
