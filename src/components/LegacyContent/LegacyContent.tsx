'use client'

import { useState } from 'react'
import { AdminButton } from '@/components/AdminButton/AdminButton'
import { ImportProgress } from '@/components/ImportProgress/ImportProgress'
import { downloadText, StepError, step, toCsv } from '@/lib/bitrixImportClient'
import styles from './LegacyContent.module.css'

const ENDPOINT = '/api/admin/legacy-content'
const OLD_SITE = 'https://cad.kz'

type Failure = { path: string; reason: string }
type PagesAnswer = {
  next: number
  total: number
  created: number
  updated: number
  existing: number
  failed: Failure[]
}
type ImagesAnswer = {
  publications: number
  downloaded: number
  reused: number
  remaining: number
  failed: Failure[]
}
type Totals = {
  created: number
  updated: number
  existing: number
  downloaded: number
  reused: number
}
type State = {
  phase: 'idle' | 'running' | 'stopped' | 'done'
  done: number
  total: number
  totals: Totals
  failed: Failure[]
  error?: string
}

const initial: State = {
  phase: 'idle',
  done: 0,
  total: 0,
  totals: { created: 0, updated: 0, existing: 0, downloaded: 0, reused: 0 },
  failed: [],
}

const message = (error: unknown) =>
  error instanceof StepError ? error.message : 'Нет связи с сайтом.'

/** Шаг по страницам старого сайта: шлём запросы, пока сервер не дойдёт до конца списка. */
function usePages(action: 'publications' | 'products') {
  const [state, setState] = useState<State>(initial)
  async function run() {
    const current: State = {
      ...initial,
      phase: 'running',
      totals: { ...initial.totals },
      failed: [],
    }
    setState(current)
    let offset = 0
    try {
      for (;;) {
        const answer = await step<PagesAnswer>({ action, offset }, ENDPOINT)
        current.totals.created += answer.created
        current.totals.updated += answer.updated
        current.totals.existing += answer.existing
        current.failed.push(...answer.failed)
        current.done = answer.next
        current.total = answer.total
        setState({ ...current })
        if (answer.next >= answer.total) break
        if (answer.next <= offset) throw new StepError('Сервер не продвинулся: попробуйте ещё раз.')
        offset = answer.next
      }
      setState({ ...current, phase: 'done' })
    } catch (error) {
      setState({ ...current, phase: 'stopped', error: message(error) })
    }
  }
  return { state, run }
}

/** Картинки в текстах: шлём запросы, пока на старом сайте остаются картинки из текстов. */
function useImages() {
  const [state, setState] = useState<State>(initial)
  async function run() {
    const current: State = {
      ...initial,
      phase: 'running',
      totals: { ...initial.totals },
      failed: [],
    }
    setState(current)
    try {
      for (;;) {
        const answer = await step<ImagesAnswer>({ action: 'images' }, ENDPOINT)
        current.done += answer.publications
        current.total = current.done + answer.remaining
        current.totals.downloaded += answer.downloaded
        current.totals.reused += answer.reused
        current.failed.push(...answer.failed)
        setState({ ...current })
        if (!answer.remaining) break
        if (!answer.publications)
          throw new StepError('Сервер не продвинулся: старый сайт не отвечает.')
      }
      setState({ ...current, phase: 'done' })
    } catch (error) {
      setState({ ...current, phase: 'stopped', error: message(error) })
    }
  }
  return { state, run }
}

function downloadFailed(name: string, failed: Failure[]) {
  const rows = [
    ['Адрес на старом сайте', 'Причина'],
    ...failed.map((f) => [f.path.startsWith('/') ? OLD_SITE + f.path : f.path, f.reason]),
  ]
  downloadText(name, toCsv(rows), 'text/csv')
}

type StepProps = {
  title: string
  text: string
  button: string
  label: string
  summary: (state: State) => string
  file: string
  state: State
  run: () => void
}

function Step({ title, text, button, label, summary, file, state, run }: StepProps) {
  return (
    <section className={styles.step}>
      <h2 className={styles.subtitle}>{title}</h2>
      <p className={styles.line}>{text}</p>
      <div>
        <AdminButton disabled={state.phase === 'running'} onClick={run}>
          {state.phase === 'idle' ? button : 'Запустить ещё раз'}
        </AdminButton>
      </div>
      {state.phase === 'running' && (
        <ImportProgress label={label} done={state.done} total={state.total} />
      )}
      {state.phase === 'stopped' && (
        <p className={styles.error} role="alert">
          Остановлено: {state.error} Запустите ещё раз — перенесённое пропускается.
        </p>
      )}
      {state.phase === 'done' && (
        <p className={styles.done} role="status">
          Готово.
        </p>
      )}
      {state.phase !== 'idle' && <p className={styles.line}>{summary(state)}</p>}
      {state.failed.length > 0 && (
        <details>
          <summary>Не перенеслось: {state.failed.length}</summary>
          <ul className={styles.failed}>
            {state.failed.slice(0, 200).map((f) => (
              <li key={`${f.path}-${f.reason}`}>
                {f.path} — {f.reason}
              </li>
            ))}
          </ul>
          <AdminButton secondary onClick={() => downloadFailed(file, state.failed)}>
            Скачать список таблицей
          </AdminButton>
        </details>
      )}
    </section>
  )
}

type Props = { publications: number; news: number; promotion: number; article: number }

/** Перенос со старого cad.kz: три независимых шага, каждый можно повторять. */
export function LegacyContent({ publications, news, promotion, article }: Props) {
  const pages = usePages('publications')
  const images = useImages()
  const products = usePages('products')
  return (
    <div className={styles.root}>
      <Step
        title="1. Новости, акции и статьи"
        text={`Со старого сайта переносятся ${publications} страниц: новостей ${news}, акций ${promotion}, статей ${article}. Заголовок, дата, текст, title и description. Старые адреса сразу начинают вести на новые страницы. Уже перенесённые не трогаются, правки в админке не пропадут.`}
        button="Перенести публикации"
        label="Страницы старого сайта"
        summary={(s) =>
          `Создано ${s.totals.created}, уже были ${s.totals.existing}, не перенеслось ${s.failed.length}.`
        }
        file="publikacii-ne-pereneslis.csv"
        state={pages.state}
        run={pages.run}
      />
      <Step
        title="2. Картинки в текстах"
        text="Картинки из перенесённых текстов скачиваются в «Медиа», первая становится обложкой. Картинку, которой на старом сайте уже нет, убираем из текста и показываем в списке."
        button="Скачать картинки"
        label="Публикации с картинками"
        summary={(s) =>
          `Обработано публикаций ${s.done}, картинок скачано ${s.totals.downloaded}, уже были ${s.totals.reused}, не скачалось ${s.failed.length}.`
        }
        file="kartinki-statey-ne-skachalis.csv"
        state={images.state}
        run={images.run}
      />
      <Step
        title="3. Title и description товаров"
        text="Для товаров, которые были на старом сайте, берутся title и description их старых страниц — чтобы в поиске всё осталось как было. Заполняются только пустые поля «Для поисковиков»."
        button="Перенести title и description"
        label="Товары со старым адресом"
        summary={(s) =>
          `Заполнено ${s.totals.updated}, уже были заполнены ${s.totals.existing}, не получилось ${s.failed.length}.`
        }
        file="tovary-seo-ne-pereneslos.csv"
        state={products.state}
        run={products.run}
      />
    </div>
  )
}
