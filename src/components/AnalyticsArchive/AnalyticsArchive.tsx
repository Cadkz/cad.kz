import { AnalyticsArchiveActions } from '@/components/AnalyticsArchiveActions/AnalyticsArchiveActions'
import {
  ARCHIVE_MONTHS,
  archivePeriod,
  formatDay,
  formatStamp,
} from '@/domain/analyticsArchive.mjs'
import type { archiveStatus } from '@/lib/analyticsArchive'
import styles from './AnalyticsArchive.module.css'

type Props = { status: Awaited<ReturnType<typeof archiveStatus>> }

/**
 * Блок «Архив на почту» страницы «Аналитика», только администратору: когда архив уходил, когда
 * следующий, ошибка последней попытки, кнопки «Отправить сейчас» и «Скачать архив».
 */
export function AnalyticsArchive({ status }: Props) {
  const { state, next, mail } = status
  const period = archivePeriod(state, new Date())
  const download = `/api/admin/analytics/archive?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}`
  const failed = state.lastError && state.lastAttemptAt
  return (
    <section className={styles.root} aria-labelledby="analytics-archive">
      <h2 className={styles.heading} id="analytics-archive">
        Архив на почту
      </h2>
      <p className={styles.text}>
        Раз в {ARCHIVE_MONTHS} месяца сайт собирает аналитику с прошлой отправки — таблицы этой
        страницы, все запросы поиска и разговоры Кадди (телефоны и почта скрыты) — в архив .zip и
        отправляет письмом всем пользователям с ролью «Администратор».
      </p>
      <p className={styles.text}>
        {state.lastSentAt
          ? `Последний архив: ${formatStamp(state.lastSentAt)}, администраторов: ${state.lastRecipients ?? '—'}${state.lastAttached === false ? ' (ссылкой — архив большой)' : ''}.`
          : 'Архив ещё не отправлялся.'}{' '}
        {next ? `Следующий — примерно ${formatDay(next)}.` : 'Первый уйдёт при ближайшей проверке.'}
      </p>
      {failed && (
        <p className={styles.error}>
          Попытка {formatStamp(state.lastAttemptAt ?? '')} не удалась: {state.lastError}
        </p>
      )}
      {!mail && (
        <p className={styles.error}>
          Почта сайта не настроена, письмо не уйдёт. Нужны переменные SMTP_HOST, SMTP_PORT,
          SMTP_USER и SMTP_PASSWORD на Vercel. Скачать архив можно и без почты.
        </p>
      )}
      <AnalyticsArchiveActions
        canSend={mail}
        download={download}
        period={`${formatDay(period.from)} – ${formatDay(period.to)}`}
      />
    </section>
  )
}
