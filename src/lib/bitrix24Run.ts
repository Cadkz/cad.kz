import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import type { CrmLead } from '@/domain/integrations'
import { bitrix24Client, crmGateway } from './crm/gateway'
import { deliverDue } from './crm/outbox'

/** Права вебхука: без crm лиды не создать; user — чтобы видеть, от чьего имени он работает. */
const NEEDED_SCOPES = ['crm', 'user'] as const

const STATE_LABELS: Record<string, string> = {
  sent: 'Отправлено',
  pending: 'Ждёт отправки',
  processing: 'Отправляется',
  failed: 'Ошибка, будет повтор',
  dead: 'Попытки закончились',
  'not-sent-demo': 'Не отправлено: демо',
}

export type Bitrix24Status = {
  connected: boolean
  host: string | null
  test: boolean
  responsibleId: string | null
  queue: { state: string; label: string; count: number }[]
  problems: { id: string | number; error: string; attempts: number; updatedAt: string }[]
}

/** Что показать на странице: подключён ли вебхук, режим и состояние очереди передачи. */
export async function loadBitrix24Status(payload: Payload): Promise<Bitrix24Status> {
  const client = bitrix24Client()
  const queue = await Promise.all(
    Object.entries(STATE_LABELS).map(async ([state, label]) => {
      const { totalDocs } = await payload.count({
        collection: 'crm-deliveries',
        where: { state: { equals: state } },
        overrideAccess: true,
      })
      return { state, label, count: totalDocs }
    }),
  )
  const failed = await payload.find({
    collection: 'crm-deliveries',
    where: { state: { in: ['failed', 'dead'] } },
    sort: '-updatedAt',
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })
  return {
    connected: Boolean(client),
    host: client?.host ?? null,
    test: process.env.APP_MODE === 'demo',
    responsibleId: process.env.BITRIX24_RESPONSIBLE_ID?.trim() || null,
    queue: queue.filter((row) => row.count > 0),
    problems: failed.docs.map((doc) => ({
      id: doc.id,
      error: doc.lastError ?? '',
      attempts: doc.attempts ?? 0,
      updatedAt: doc.updatedAt,
    })),
  }
}

export type Bitrix24Reply =
  | { ok: true; message: string; link?: string; details?: string[] }
  | { ok: false; error: string; status: number }

const NOT_CONNECTED: Bitrix24Reply = {
  ok: false,
  status: 409,
  error: 'Вебхук не вписан: в Vercel нет BITRIX24_WEBHOOK_URL (или адрес не похож на вебхук).',
}

function failure(error: unknown): Bitrix24Reply {
  const message = error instanceof Error ? error.message : 'неизвестная ошибка'
  return { ok: false, status: 502, error: message.slice(0, 300) }
}

/** «Проверить связь»: портал отвечает, какие права у вебхука и чьи они. */
export async function checkBitrix24(): Promise<Bitrix24Reply> {
  const client = bitrix24Client()
  if (!client) return NOT_CONNECTED
  try {
    const info = await client.check()
    const missing = NEEDED_SCOPES.filter((scope) => !info.scopes.includes(scope))
    const details = [
      `Портал: ${info.host}`,
      `Вебхук от имени: ${info.user}${info.admin ? ' (администратор)' : ''}`,
      `Права: ${info.scopes.join(', ') || 'нет'}`,
    ]
    if (missing.length)
      return {
        ok: false,
        status: 409,
        error: `Связь есть, но у вебхука не хватает прав: ${missing.join(', ')}. ${details.join('. ')}.`,
      }
    return { ok: true, message: 'Связь с Битрикс24 есть, прав достаточно.', details }
  } catch (error) {
    return failure(error)
  }
}

/** Тестовый лид: один товар за 1 000 ₸ и переписка из двух сообщений — как после чата с Кадди. */
function testLead(): CrmLead {
  const key = randomUUID()
  return {
    idempotencyKey: key,
    orderNumber: `TEST-${key.slice(0, 8).toUpperCase()}`,
    kind: 'consult',
    kindLabel: 'Проверка связи',
    pageTitle: 'Админка сайта',
    source: {
      button: 'Админка: тестовый лид',
      product: null,
      section: null,
      scenario: null,
      page: '/admin/bitrix24',
    },
    consent: { accepted: true, at: new Date().toISOString(), version: 'test' },
    contact: { name: 'Проверка сайта', phone: '+77000000000' },
    buyer: { type: 'individual' },
    items: [
      {
        offerId: 'test',
        title: 'Проверочный товар',
        configuration: 'Без комплектации',
        license: '—',
        quantity: 1,
        unitKzt: '1000',
        totalKzt: '1000',
      },
    ],
    totalKzt: '1000',
    messages: [
      { role: 'user', content: 'Это проверка связи сайта с Битрикс24.' },
      { role: 'assistant', content: 'Лид можно удалить.' },
    ],
  }
}

/**
 * «Отправить тестовый лид»: лид с товаром, затем поиск его по ключу — так проверяется и создание,
 * и защита от дублей. Лид помечен «ТЕСТ сайта», его можно удалить в Битрикс24.
 */
export async function sendTestLead(): Promise<Bitrix24Reply> {
  const client = bitrix24Client()
  if (!client) return NOT_CONNECTED
  const lead = testLead()
  try {
    const { externalId } = await client.deliver(lead)
    const found = await client.find(lead.idempotencyKey)
    const details = [
      `Лид №${externalId} создан с товаром «Проверочный товар» за 1 000 ₸ и перепиской в комментарии.`,
      found?.externalId === externalId
        ? 'Поиск по ключу заявки работает: повторная отправка не создаст дубль.'
        : 'Внимание: лид не находится по ключу заявки. При обрыве связи возможен дубль — сообщите разработчику.',
    ]
    return {
      ok: true,
      message: 'Тестовый лид отправлен.',
      link: client.leadUrl(externalId),
      details,
    }
  } catch (error) {
    return failure(error)
  }
}

/** «Дослать отложенные»: заявки с ошибкой и подошедшим временем повтора. */
export async function retryDue(payload: Payload): Promise<Bitrix24Reply> {
  if (!bitrix24Client()) return NOT_CONNECTED
  try {
    const processed = await deliverDue(payload, crmGateway(), 20)
    return {
      ok: true,
      message: processed
        ? `Обработано заявок: ${processed}. Обновите страницу, чтобы увидеть состояние.`
        : 'Нечего досылать: отложенных заявок с подошедшим временем нет.',
    }
  } catch (error) {
    return failure(error)
  }
}
