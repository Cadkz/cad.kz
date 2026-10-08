import { toBitrix24Lead } from '@/domain/bitrix24.mjs'
import type { CrmGateway } from '@/domain/integrations'

/**
 * Тестовый адаптер Битрикс24. Собирает запрос так, как отправил бы его в CRM, чтобы ошибки
 * сопоставления полей находились сразу, но ничего не отправляет: сетевых вызовов нет.
 * Результат всегда честный — не отправлено, а не успех.
 */
export const bitrix24TestGateway: CrmGateway = {
  async deliver(lead) {
    toBitrix24Lead(lead)
    return { status: 'not-sent-demo' }
  },
  async find() {
    return null
  },
}
