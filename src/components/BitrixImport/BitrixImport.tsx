'use client'

import { type ReactNode, useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { ImportFiles } from '@/components/ImportFiles/ImportFiles'
import { ImportImages } from '@/components/ImportImages/ImportImages'
import { ImportReport } from '@/components/ImportReport/ImportReport'
import { ImportWrite } from '@/components/ImportWrite/ImportWrite'
import { renderReport } from '@/domain/bitrixReport.mjs'
import { type Analysis, analyzeFiles, downloadText } from '@/lib/bitrixImportClient'
import styles from './BitrixImport.module.css'

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className={styles.step}>
      <h2 className={styles.title}>
        <span className={styles.number}>{number}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Импорт из Битрикса по шагам: файлы → проверка → запись в базу → картинки. */
export function BitrixImport() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [reading, setReading] = useState(false)
  // Новый набор файлов — новый план: шаги записи и картинок начинаются заново.
  const [version, setVersion] = useState(0)

  async function choose(files: File[]) {
    setReading(true)
    try {
      setAnalysis(await analyzeFiles(files))
    } catch {
      setAnalysis({ ok: false, files: [], error: 'Не удалось прочитать файлы.' })
    } finally {
      setReading(false)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div className={styles.root}>
      <Step number={1} title="Файлы выгрузки">
        <ImportFiles files={analysis?.files ?? []} busy={reading} onChoose={choose} />
        {reading && <p className={styles.note}>Читаем файлы…</p>}
        {analysis && !analysis.ok && (
          <p className={styles.error} role="alert">
            {analysis.error}
          </p>
        )}
      </Step>

      {analysis?.ok && (
        <>
          <Step number={2} title="Проверка: что будет перенесено">
            <p className={styles.note}>В базу пока ничего не записано.</p>
            {analysis.missing.length > 0 && (
              <p className={styles.warning}>
                Не выбран файл: {analysis.missing.join(', ')}. Без него часть цен не перенесётся.
              </p>
            )}
            <ImportReport catalog={analysis.catalog} />
            <div>
              <AdminButton
                secondary
                onClick={() => downloadText('import-report.md', renderReport(analysis.catalog))}
              >
                Скачать полный отчёт
              </AdminButton>
            </div>
          </Step>
          <Step number={3} title="Запись в базу">
            <ImportWrite key={version} plan={analysis.plan} />
          </Step>
          <Step number={4} title="Картинки товаров">
            <ImportImages key={version} plan={analysis.plan} />
          </Step>
        </>
      )}
    </div>
  )
}
