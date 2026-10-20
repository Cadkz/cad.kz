import type { Payload } from 'payload'
import { type CrmState, crmGateway, crmLive, crmState } from './gateway'
import { deliverByKey, deliverDue } from './outbox'

export type { CrmState }

/** Сколько отложенных заявок дослать заодно с новой: очередь не копится, даже без расписания. */
const CATCH_UP = 3

/**
 * Передаёт заявку в CRM сразу после сохранения и заодно досылает несколько отложенных.
 * Ждём результат: на хостинге с функциями работа после ответа может не завершиться.
 * Ошибки не пробрасываются: заявка к этому моменту уже сохранена и останется в очереди.
 */
export async function passToCrm(payload: Payload, idempotencyKey: string): Promise<CrmState> {
  const gateway = crmGateway()
  let state: string | null | undefined = null
  try {
    state = (await deliverByKey(payload, idempotencyKey, gateway))?.state
  } catch (error) {
    console.error('Не удалось обработать очередь CRM', error)
  }
  if (crmLive()) {
    try {
      await deliverDue(payload, gateway, CATCH_UP)
    } catch (error) {
      console.error('Не удалось дослать отложенные заявки в CRM', error)
    }
  }
  return crmState(state)
}

/** Состояние уже сохранённой заявки (повторная отправка той же формы). */
export async function crmStateByKey(payload: Payload, idempotencyKey: string): Promise<CrmState> {
  const found = await payload.find({
    collection: 'crm-deliveries',
    where: { idempotencyKey: { equals: idempotencyKey } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return crmState(found.docs[0]?.state)
}
