'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { CoursePages } from '@/components/CoursePages/CoursePages'
import { adminCall } from '@/lib/adminCall'
import styles from './CoursesActions.module.css'

type Extra = { id: number; title: string }
type Page = { id: number; title: string; link: string }
type Props = { extra: Extra[]; pages: Page[]; ready: boolean }
type Result = { message: string }

/**
 * «Прочитать сейчас»: таблица УЦ читается сразу, а не ночью по расписанию; вместе с ней сайт
 * обновляет цены курсов и заводит новые.
 */
export function CoursesRead() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  async function read() {
    setBusy(true)
    setMessage('')
    try {
      const reply = await adminCall<Result>('/api/admin/courses', { action: 'read' })
      setFailed(false)
      setMessage(reply.message)
      router.refresh()
    } catch (failure) {
      setFailed(true)
      setMessage(failure instanceof Error ? failure.message : 'Не получилось. Повторите.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={styles.read}>
      <AdminButton onClick={read} disabled={busy}>
        {busy ? 'Читаю таблицу…' : 'Прочитать сейчас'}
      </AdminButton>
      {message && (
        <p className={failed ? styles.error : styles.ok} role={failed ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </div>
  )
}

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
 * можно «Активностью» в каталоге), и обновить описания со страниц l-p.kz (CoursePages). Всё
 * отмечено — снять лишнее галочкой.
 */
export function CoursesActions({ extra, pages, ready }: Props) {
  const router = useRouter()
  const hide = useChecks(extra.map((c) => c.id))
  const [running, setRunning] = useState<'hide' | null>(null)
  const busy = running !== null
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  async function run(action: 'hide', ids: number[]) {
    setRunning(action)
    setResult('')
    setError('')
    try {
      const reply = await adminCall<Result>('/api/admin/courses', { action, ids })
      setResult(reply.message)
      router.refresh()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не получилось. Повторите.')
    } finally {
      setRunning(null)
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
      <CoursePages pages={pages} ready={ready} />
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
