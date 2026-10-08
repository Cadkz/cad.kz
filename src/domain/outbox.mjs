// Очередь передачи заявок в CRM: решения о состоянии записи после попытки доставки.
// Сама доставка и база — снаружи (src/lib/crm). Здесь только правила, чтобы их можно было проверить.
//
// Состояния записи: pending → processing → sent | not-sent-demo | failed → … → dead.
// failed — ждём следующей попытки, dead — попытки закончились, нужен человек.

export const MAX_ATTEMPTS = 5
const BASE_DELAY_MS = 60 * 1000
const MAX_DELAY_MS = 60 * 60 * 1000

/** Неясный итог: запрос мог дойти до CRM (таймаут, обрыв). Слепо повторять создание нельзя. */
export class AmbiguousDeliveryError extends Error {}

/** Пауза перед следующей попыткой: 1, 2, 4, 8 минут, не дольше часа. */
export function backoffMs(attempts) {
  return Math.min(BASE_DELAY_MS * 2 ** Math.max(0, attempts - 1), MAX_DELAY_MS)
}

function safeMessage(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 300)
}

/**
 * Одна попытка доставки. Возвращает изменения для записи очереди.
 * @param {{ snapshot: object, attempts: number, ambiguous?: boolean }} delivery
 * @param {{ deliver: Function, find?: Function }} gateway
 * @param {Date} now
 */
export async function attemptDelivery(delivery, gateway, now) {
  const attempts = delivery.attempts + 1
  try {
    // После неясного итога сначала спрашиваем CRM, не создан ли уже лид с нашим ключом.
    if (delivery.ambiguous && gateway.find) {
      const found = await gateway.find(delivery.snapshot.idempotencyKey)
      if (found)
        return {
          state: 'sent',
          attempts,
          externalId: found.externalId,
          ambiguous: false,
          lastError: null,
          nextAttemptAt: null,
        }
    }
    const result = await gateway.deliver(delivery.snapshot)
    return {
      state: result.status,
      attempts,
      externalId: result.externalId,
      ambiguous: false,
      lastError: null,
      nextAttemptAt: null,
    }
  } catch (error) {
    return {
      state: attempts >= MAX_ATTEMPTS ? 'dead' : 'failed',
      attempts,
      ambiguous: error instanceof AmbiguousDeliveryError,
      lastError: safeMessage(error),
      nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)).toISOString(),
    }
  }
}
