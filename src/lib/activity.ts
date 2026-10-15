import type { Payload } from 'payload'
import type { ActivityLog } from '../../payload-types'

export type ActivityInput = {
  action: ActivityLog['action']
  summary: string
  /** Кто сделал; пусто — сайт сам (очередь CRM, автонастройка при сборке). */
  userId?: number | string | null
  /** Адрес в админке, где посмотреть подробности. */
  link?: string
  details?: Record<string, unknown>
}

/**
 * Запись в «Журнал действий». Отдельно от основной операции и без исключений наружу:
 * сбой журнала не должен отменять смену курса или загрузку прайса.
 */
export async function logActivity(payload: Payload, input: ActivityInput) {
  const user = input.userId == null ? null : Number(input.userId)
  try {
    await payload.create({
      collection: 'activity-log',
      data: {
        action: input.action,
        summary: input.summary.slice(0, 300),
        user: user !== null && Number.isSafeInteger(user) ? user : null,
        link: input.link,
        details: input.details,
      },
      overrideAccess: true,
      depth: 0,
    })
  } catch (error) {
    console.error(
      'Журнал действий: запись не сохранилась',
      error instanceof Error ? error.message : '',
    )
  }
}
