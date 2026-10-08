'use client'

import { AdminButton } from '@/components/AdminButton/AdminButton'
import { ImportProgress } from '@/components/ImportProgress/ImportProgress'
import type { Plan } from '@/lib/bitrixImportClient'
import { type ImagesTotals, useBitrixImages } from '@/lib/useBitrixImages'
import styles from './ImportImages.module.css'

function Totals({ totals }: { totals: ImagesTotals }) {
  return (
    <>
      <p className={styles.line}>
        Скачано {totals.downloaded}, уже были {totals.reused}, галерей заполнено {totals.galleries},
        не скачалось {totals.failed.length}.
      </p>
      {totals.failed.length > 0 && (
        <details>
          <summary>Какие картинки не скачались</summary>
          <ul className={styles.failed}>
            {totals.failed.slice(0, 200).map((f) => (
              <li key={f.path}>
                {f.product}: {f.path} ({f.reason})
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

/** Шаг «Картинки»: докачка со старого cad.kz частями, с ходом и итогом. */
export function ImportImages({ plan }: { plan: Plan }) {
  const { state, withImages, run } = useBitrixImages(plan)
  if (!withImages) return <p className={styles.line}>У товаров в выгрузке нет картинок.</p>
  const busy = state.phase === 'running'

  return (
    <div className={styles.root}>
      <p className={styles.line}>
        Картинки есть у {withImages} товаров. Их скачивает сам сайт со старого cad.kz, частями, и
        только для товаров, уже записанных в базу (шаг 3). Товары с уже заполненной галереей
        пропускаются, повторный запуск докачивает остальное.
      </p>
      <div>
        <AdminButton disabled={busy} onClick={run}>
          {state.phase === 'idle' ? 'Скачать картинки' : 'Докачать картинки'}
        </AdminButton>
      </div>
      {state.phase === 'running' && (
        <ImportProgress label="Товары с картинками" done={state.done} total={state.total} />
      )}
      {state.phase === 'stopped' && (
        <p className={styles.error} role="alert">
          Остановлено: {state.error} Обработано товаров {state.done} из {state.total}. Нажмите
          «Докачать картинки», чтобы продолжить.
        </p>
      )}
      {state.phase === 'done' && (
        <p className={styles.done} role="status">
          Готово: обработаны все {state.total} товаров с картинками.
        </p>
      )}
      {state.phase !== 'idle' && <Totals totals={state.totals} />}
    </div>
  )
}
