import type { Payload } from 'payload'
import type { HandoffDraft, StoredMessage } from '@/domain/assistant.mjs'
import type { AssistantMode } from './provider'

/**
 * Разговор с Кадди хранится на сервере в журнале «Диалоги консультанта» (коллекция conversations):
 * ключ — UUID разговора из браузера, снимок — сообщения. Из браузера приходит только новое
 * сообщение, поэтому история в лиде Битрикс24 — ровно то, что видел клиент.
 */
export type ConversationSnapshot = {
  version: 1
  mode: AssistantMode
  messages: StoredMessage[]
  /** Отпечаток адреса (src/lib/checkout.ts clientHash), сам адрес не хранится. */
  clientHash: string
  /** Номер заявки, с которой разговор передан менеджеру. */
  requestNumber?: string
  /** Что Кадди собрал для передачи менеджеру (инструмент handoffToManager): почта, компания, задача… */
  handoff?: HandoffDraft
}

export type ConversationState = 'open' | 'handed-off'

export type StoredConversation = {
  id: number
  updatedAt: string
  state: ConversationState
  snapshot: ConversationSnapshot
}

const options = { overrideAccess: true, depth: 0 } as const

function isSnapshot(value: unknown): value is ConversationSnapshot {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    Array.isArray((value as ConversationSnapshot).messages)
  )
}

export async function findConversation(
  payload: Payload,
  key: string,
): Promise<StoredConversation | null> {
  const { docs } = await payload.find({
    collection: 'conversations',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    ...options,
  })
  const doc = docs[0]
  if (!doc || !isSnapshot(doc.snapshot)) return null
  return {
    id: doc.id,
    updatedAt: doc.updatedAt,
    state: doc.state === 'handed-off' ? 'handed-off' : 'open',
    snapshot: doc.snapshot,
  }
}

/**
 * Сохраняет разговор. Существующий — условным обновлением по времени последнего изменения:
 * если его успели изменить параллельным запросом, вернёт false и ничего не перезапишет.
 */
export async function saveConversation(
  payload: Payload,
  key: string,
  previous: StoredConversation | null,
  snapshot: ConversationSnapshot,
  state: ConversationState = previous?.state ?? 'open',
): Promise<boolean> {
  const data = { snapshot: structuredClone(snapshot), state }
  if (!previous) {
    try {
      await payload.create({
        collection: 'conversations',
        data: { idempotencyKey: key, ...data },
        ...options,
      })
      return true
    } catch {
      // Тот же ключ уже создан параллельным запросом (ключ уникален).
      return false
    }
  }
  const updated = await payload.update({
    collection: 'conversations',
    where: {
      and: [{ id: { equals: previous.id } }, { updatedAt: { equals: previous.updatedAt } }],
    },
    data,
    ...options,
  })
  return updated.docs.length > 0
}
