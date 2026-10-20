import { createBitrix24Client, parseWebhookUrl } from '@/domain/bitrix24Client.mjs'
import type { CrmGateway } from '@/domain/integrations'
import type { CrmState } from '../crmNotice'
import { bitrix24TestGateway } from './bitrix24Test'

export type { CrmState }

/** Вебхук вписан и похож на настоящий — заявки уходят в Битрикс24. */
export function crmLive() {
  return Boolean(parseWebhookUrl(process.env.BITRIX24_WEBHOOK_URL))
}

/** Клиент Битрикс24 по настройкам из .env или null, если вебхука нет. */
export function bitrix24Client() {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL
  if (!parseWebhookUrl(webhookUrl) || !webhookUrl) return null
  return createBitrix24Client({
    webhookUrl,
    fetch: globalThis.fetch,
    // Демоверсия сайта шлёт лиды с пометкой «ТЕСТ сайта», чтобы менеджеры не приняли их за клиентов.
    test: process.env.APP_MODE === 'demo',
    responsibleId: process.env.BITRIX24_RESPONSIBLE_ID?.trim() || undefined,
  })
}

/** Адаптер очереди: настоящий при вписанном вебхуке, иначе тестовый без сети. */
export function crmGateway(): CrmGateway {
  return bitrix24Client() ?? bitrix24TestGateway
}

/** Что сказать покупателю по итогу попытки доставки. */
export function crmState(state: string | null | undefined): CrmState {
  if (state === 'sent') return 'sent'
  return crmLive() ? 'queued' : 'demo'
}
