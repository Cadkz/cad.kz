import type { Payload } from 'payload'
import {
  ARCHIVE_STATE_KEY,
  type ArchiveState,
  archiveFiles,
  archiveMail,
  archiveName,
  archivePeriod,
  isDue,
  MAX_ATTACHMENT_BYTES,
  nextDue,
} from '@/domain/analyticsArchive.mjs'
import { QUICK_ACTIONS } from '@/domain/assistant.mjs'
import { summarizeConversations, summarizeSearches } from '@/domain/searchStats.mjs'
import { createZip } from '@/domain/zip.mjs'
import { mailConfigured, sendMail } from './mail'
import { siteUrl } from './seo'

/**
 * Архив аналитики на почту администраторам (src/domain/analyticsArchive.mjs): чтение данных за
 * период, сборка .zip, письмо и запись «когда отправили» в коллекцию integrations.
 * Запускают: проверка по расписанию раз в сутки (/api/cron/analytics-archive, vercel.json) и кнопка
 * «Отправить архив сейчас» на странице «Аналитика».
 */

const options = { overrideAccess: true, depth: 0 } as const

/** Сколько читать за период: запросы поиска короткие, разговоры с перепиской тяжелее. */
const SEARCHES_MAX = 100_000
const SEARCHES_PAGE = 5_000
const CONVERSATIONS_MAX = 5_000
const CONVERSATIONS_PAGE = 200

/** Другая отправка началась меньше этого назад — вторую не запускаем. */
const BUSY_MS = 5 * 60_000

type StoredState = {
  id: number
  updatedAt: string
  state: ArchiveState & { sendingSince?: string }
}

function isState(value: unknown): value is ArchiveState {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function loadState(payload: Payload): Promise<StoredState | null> {
  const { docs } = await payload.find({
    collection: 'integrations',
    where: { key: { equals: ARCHIVE_STATE_KEY } },
    limit: 1,
    ...options,
  })
  const doc = docs[0]
  if (!doc || !isState(doc.state)) return null
  return { id: doc.id, updatedAt: doc.updatedAt, state: doc.state }
}

/** Состояние для страницы «Аналитика»: когда отправляли, когда следующий, ошибка. */
export async function archiveStatus(payload: Payload) {
  const stored = await loadState(payload)
  const state: ArchiveState = stored?.state ?? {}
  return { state, next: nextDue(state)?.toISOString() ?? null, mail: mailConfigured() }
}

/**
 * Занять отправку: записать «отправка идёт». Условие по времени изменения записи — если её
 * успел изменить другой запрос (кнопка и расписание одновременно), вторая отправка не начнётся.
 */
async function claim(payload: Payload, now: Date): Promise<StoredState | null> {
  const stored = await loadState(payload)
  const sending = stored?.state.sendingSince
  if (sending && now.getTime() - new Date(sending).getTime() < BUSY_MS) return null
  const state = { ...(stored?.state ?? {}), sendingSince: now.toISOString() }
  if (!stored) {
    try {
      const doc = await payload.create({
        collection: 'integrations',
        data: { key: ARCHIVE_STATE_KEY, state },
        ...options,
      })
      return { id: doc.id, updatedAt: doc.updatedAt, state }
    } catch {
      return null
    }
  }
  const updated = await payload.update({
    collection: 'integrations',
    where: { and: [{ id: { equals: stored.id } }, { updatedAt: { equals: stored.updatedAt } }] },
    data: { state },
    ...options,
  })
  const doc = updated.docs[0]
  return doc ? { id: doc.id, updatedAt: doc.updatedAt, state } : null
}

async function release(payload: Payload, id: number, state: ArchiveState) {
  await payload.update({ collection: 'integrations', id, data: { state }, ...options })
}

/** Все записи за период по страницам, от новых к старым; возвращает от старых к новым. */
async function readPaged<T>(
  read: (page: number) => Promise<{ docs: T[]; hasNextPage: boolean }>,
  max: number,
) {
  const rows: T[] = []
  for (let page = 1; rows.length < max; page++) {
    const result = await read(page)
    rows.push(...result.docs)
    if (!result.hasNextPage) return { rows: rows.reverse(), cut: false }
  }
  // Дошли до предела: в архив — самые свежие max записей.
  return { rows: rows.slice(0, max).reverse(), cut: true }
}

type Message = {
  role: string
  content: string
  at?: string
  cards?: { title: string; href: string }[]
}

function messagesOf(snapshot: unknown): Message[] | null {
  const messages = (snapshot as { messages?: unknown } | null)?.messages
  if (!Array.isArray(messages)) return null
  return messages.filter(
    (m): m is Message =>
      Boolean(m) && typeof m === 'object' && typeof (m as Message).content === 'string',
  )
}

/** Данные архива за период: все запросы поиска и разговоры Кадди, сводки как на странице. */
export async function loadArchiveInput(payload: Payload, from: string, to: string) {
  const range = { createdAt: { greater_than_equal: from, less_than: to } }
  const [searches, conversations] = await Promise.all([
    readPaged(
      (page) =>
        payload.find({
          collection: 'search-queries',
          where: range,
          sort: '-createdAt',
          limit: SEARCHES_PAGE,
          page,
          select: { createdAt: true, query: true, found: true, source: true, click: true },
          ...options,
        }),
      SEARCHES_MAX,
    ),
    readPaged(
      (page) =>
        payload.find({
          collection: 'conversations',
          where: range,
          sort: '-createdAt',
          limit: CONVERSATIONS_PAGE,
          page,
          select: { createdAt: true, state: true, snapshot: true },
          ...options,
        }),
      CONVERSATIONS_MAX,
    ),
  ])

  const rawSearches = searches.rows.map((doc) => ({
    createdAt: doc.createdAt,
    query: doc.query,
    found: doc.found,
    source: doc.source,
    click: doc.click ?? null,
  }))
  const dialogs = conversations.rows.flatMap((doc) => {
    const messages = messagesOf(doc.snapshot)
    if (!messages) return []
    const snapshot = doc.snapshot as { requestNumber?: string; handoff?: unknown }
    return [
      {
        id: doc.id,
        createdAt: doc.createdAt,
        state: doc.state,
        requestNumber: snapshot.requestNumber ?? null,
        handoff: Boolean(snapshot.handoff),
        messages,
      },
    ]
  })

  return {
    from,
    to,
    searches: summarizeSearches(rawSearches),
    kaddi: summarizeConversations(
      dialogs,
      QUICK_ACTIONS.flatMap((action) => (action.text ? [action.text] : [])),
    ),
    rawSearches,
    conversations: dialogs,
    searchesCut: searches.cut,
    conversationsCut: conversations.cut,
  }
}

/** Архив .zip за период: для письма и для скачивания из админки. */
export async function buildArchive(payload: Payload, from: string, to: string) {
  const input = await loadArchiveInput(payload, from, to)
  const zip = createZip(archiveFiles(input), new Date(to))
  return { input, zip, name: archiveName(from, to) }
}

/** Почты всех пользователей с ролью «Администратор». */
async function adminEmails(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 100,
    pagination: false,
    select: { email: true },
    ...options,
  })
  return [...new Set(docs.map((doc) => doc.email.trim().toLowerCase()).filter(Boolean))]
}

export type ArchiveResult =
  | { ok: true; message: string; details: string[] }
  | { ok: false; error: string; status: number }

/**
 * Собрать и отправить архив всем администраторам. Период — с прошлой отправки (первый раз — за
 * ARCHIVE_MONTHS месяца). Удачная отправка сдвигает следующую по расписанию на ARCHIVE_MONTHS месяца.
 */
export async function sendArchive(payload: Payload, now = new Date()): Promise<ArchiveResult> {
  if (!mailConfigured())
    return {
      ok: false,
      status: 409,
      error:
        'Почта сайта не настроена. Нужны переменные SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD на Vercel — инструкция в docs/HANDOFF.md.',
    }
  const claimed = await claim(payload, now)
  if (!claimed)
    return { ok: false, status: 409, error: 'Архив уже отправляется. Подождите пару минут.' }
  const { sendingSince: _busy, ...previous } = claimed.state
  const failed = async (error: string, status = 502): Promise<ArchiveResult> => {
    await release(payload, claimed.id, {
      ...previous,
      lastAttemptAt: now.toISOString(),
      lastError: error,
    })
    return { ok: false, status, error }
  }

  try {
    const recipients = await adminEmails(payload)
    if (!recipients.length)
      return await failed('В админке нет ни одного администратора с почтой.', 409)
    const { from, to } = archivePeriod(previous, now)
    const { input, zip, name } = await buildArchive(payload, from, to)
    const attached = zip.length <= MAX_ATTACHMENT_BYTES
    const mail = archiveMail({
      input,
      siteUrl: siteUrl(),
      attached,
      bytes: zip.length,
      next: nextDue({ lastSentAt: now.toISOString() }),
    })
    const sent = await sendMail({
      to: recipients,
      subject: mail.subject,
      text: mail.text,
      attachments: attached
        ? [{ filename: name, content: zip, contentType: 'application/zip' }]
        : [],
    })
    if (!sent.ok) return await failed(sent.error)
    await release(payload, claimed.id, {
      lastSentAt: now.toISOString(),
      lastFrom: from,
      lastRecipients: recipients.length,
      lastAttached: attached,
      lastBytes: zip.length,
      lastAttemptAt: now.toISOString(),
    })
    return {
      ok: true,
      message: `Архив отправлен администраторам: ${recipients.length}.`,
      details: [
        `Кому: ${recipients.join(', ')}`,
        `Размер архива: ${Math.max(1, Math.round(zip.length / 1024))} КБ${attached ? ', во вложении' : ' — больше лимита, в письме ссылка на скачивание'}.`,
        `Поисков: ${input.searches.total}, разговоров с Кадди: ${input.kaddi.total}.`,
      ],
    }
  } catch (error) {
    console.error('Архив аналитики: ошибка', error)
    return await failed('Архив не собрался из-за ошибки на сервере. Повторите позже.', 500)
  }
}

/** Проверка по расписанию: отправить, если с прошлой отправки прошло ARCHIVE_MONTHS месяца. */
export async function runScheduledArchive(payload: Payload, now = new Date()) {
  const stored = await loadState(payload)
  if (!isDue(stored?.state ?? {}, now)) return { sent: false as const, reason: 'not-due' }
  if (!mailConfigured()) return { sent: false as const, reason: 'mail-not-configured' }
  const result = await sendArchive(payload, now)
  return result.ok
    ? { sent: true as const, reason: 'sent' }
    : { sent: false as const, reason: 'error', error: result.error }
}
