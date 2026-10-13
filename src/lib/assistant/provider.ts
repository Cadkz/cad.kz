import { ANTHROPIC_DEFAULT_MODEL } from '@/domain/anthropicChat.mjs'

/**
 * Режим консультанта:
 * - model — подключена модель (MODEL_PROVIDER=anthropic и MODEL_API_KEY);
 * - demo — модели нет, Кадди честно говорит об этом и ищет по каталогу (MODEL_PROVIDER=demo,
 *   а в демоверсии сайта — и при пустом MODEL_PROVIDER);
 * - null — консультант выключен: на сайте нет ни кнопки, ни окна.
 */
export type AssistantMode = 'model' | 'demo'

export function assistantMode(): AssistantMode | null {
  const provider = process.env.MODEL_PROVIDER?.trim().toLowerCase() ?? ''
  if (provider === 'anthropic') return process.env.MODEL_API_KEY ? 'model' : null
  if (provider === 'demo') return 'demo'
  if (provider === 'off') return null
  return !provider && process.env.APP_MODE === 'demo' ? 'demo' : null
}

/** Настройки модели из окружения. Ключ отсюда уходит только в заголовок запроса к модели. */
export function modelSettings() {
  return {
    apiKey: process.env.MODEL_API_KEY ?? '',
    model: process.env.MODEL_NAME?.trim() || ANTHROPIC_DEFAULT_MODEL,
  }
}

/**
 * Доходят ли заявки из чата до менеджеров. Пока нет: заявки сайта работают в демо-режиме с
 * тестовым адаптером Битрикс24 (src/lib/crm/bitrix24Test.ts). Поменять вместе с подключением
 * настоящего адаптера — тогда Кадди сможет говорить «Я передал…».
 */
export function leadsReachManagers() {
  return false
}
