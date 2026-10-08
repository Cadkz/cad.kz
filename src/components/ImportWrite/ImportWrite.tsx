'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { ImportProgress } from '@/components/ImportProgress/ImportProgress'
import { ISSUE_TITLES } from '@/domain/bitrixReport.mjs'
import type { Plan } from '@/lib/bitrixImportClient'
import type { RunSnapshot } from '@/lib/bitrixImportRun'
import { useBitrixWrite } from '@/lib/useBitrixWrite'
import styles from './ImportWrite.module.css'

type Counter = RunSnapshot['result']['products']

const counts = (c: Counter) =>
  `новых ${c.created}, обновлено ${c.updated}, без изменений ${c.unchanged}` +
  (c.unpublished ? `, снято с публикации ${c.unpublished}` : '')

function Result({ snapshot }: { snapshot: RunSnapshot }) {
  const { result } = snapshot
  const titles: Record<string, string> = ISSUE_TITLES
  return (
    <div className={styles.result} role="status">
      <p className={styles.done}>Каталог записан в базу.</p>
      <ul className={styles.list}>
        <li>Товары: {counts(result.products)}</li>
        <li>Варианты с ценой: {counts(result.offers)}</li>
        <li>
          Производители: новых {result.manufacturers.created}, уже были{' '}
          {result.manufacturers.unchanged}
        </li>
        {result.demoHidden > 0 && <li>Демотоваров снято с публикации: {result.demoHidden}</li>}
        <li>
          Курсы:{' '}
          {result.rates.length
            ? result.rates.map((r) => `${r.currency} ${r.from ?? 'нет'} → ${r.to}`).join(', ')
            : 'без изменений'}
        </li>
        {result.issues.map((issue) => (
          <li key={`${issue.type}-${issue.id}`}>
            {titles[issue.type] ?? issue.type}: [{issue.id}] {issue.title} — {issue.detail}
          </li>
        ))}
      </ul>
      <p>
        <a href="/" target="_blank" rel="noreferrer">
          Открыть каталог на сайте
        </a>{' '}
        · <a href="/admin/collections/products">Товары в админке</a>
      </p>
    </div>
  )
}

/** Шаг «Записать в базу»: галочка про демотовары, ход записи, итог или ошибка с продолжением. */
export function ImportWrite({ plan }: { plan: Plan }) {
  const [hideDemo, setHideDemo] = useState(true)
  const { state, start, resume } = useBitrixWrite(plan)
  const busy = state.phase === 'writing'

  return (
    <div className={styles.root}>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={hideDemo}
          disabled={busy}
          onChange={(event) => setHideDemo(event.target.checked)}
        />
        <span>
          Скрыть демотовары: снять их с публикации, чтобы на сайте был только настоящий каталог.
          Удалены они не будут.
        </span>
      </label>
      <div className={styles.actions}>
        <AdminButton disabled={busy} onClick={() => start(hideDemo)}>
          {state.phase === 'written' ? 'Записать ещё раз' : 'Записать в базу'}
        </AdminButton>
        {state.phase === 'stopped' && (
          <AdminButton secondary onClick={() => resume(hideDemo)}>
            Продолжить с места остановки
          </AdminButton>
        )}
      </div>
      {state.phase === 'writing' && (
        <>
          <ImportProgress label={state.label} done={state.done} total={state.total} />
          <p className={styles.hint}>Не закрывайте страницу, пока идёт запись.</p>
        </>
      )}
      {state.phase === 'stopped' && (
        <div className={styles.error} role="alert">
          <p>Запись остановлена: {state.error}</p>
          <p>
            Записано {state.done} из {state.total}. Уже записанное сохранено, можно продолжить.
          </p>
        </div>
      )}
      {state.phase === 'written' && <Result snapshot={state.snapshot} />}
    </div>
  )
}
