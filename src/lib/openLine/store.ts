import type { Payload } from 'payload'
import { createAppClient } from '@/domain/bitrix24App.mjs'

/** Ключ записи приложения Битрикс24 в «Подключениях». */
const KEY = 'bitrix24-app'
const options = { overrideAccess: true, depth: 0 } as const

/**
 * Состояние приложения Битрикс24 (открытая линия для Кадди). Токены — секрет: наружу (в админку,
 * журнал, ответы) не отдаются, страница «Битрикс24» показывает состояние без них.
 */
export type OpenLineState = {
  version: 1
  /** Домен портала: orient.bitrix24.kz. */
  domain: string
  memberId: string
  clientEndpoint: string
  accessToken: string
  refreshToken: string
  /** Когда истекает accessToken, мс с 1970 года. */
  expiresAt: number
  /** Токен приложения: им Битрикс24 подписывает события, чужое событие без него не пройдёт. */
  applicationToken?: string
  installedAt: string
  /** Канал зарегистрирован в контакт-центре и подписан на события. */
  registered: boolean
  /** Открытая линия, к которой подключён канал. */
  line?: { id: number; active: boolean; at: string }
  /** Имена операторов по ID пользователя Битрикс24 — чтобы не спрашивать портал каждый раз. */
  operators?: Record<string, string>
  lastSentAt?: string
  lastEventAt?: string
  lastError?: { at: string; text: string }
}

type Stored = { id: number; updatedAt: string; state: OpenLineState }

/** Ключи приложения из Vercel. Без них открытая линия выключена. */
export function appCredentials() {
  const clientId = process.env.BITRIX24_APP_CLIENT_ID?.trim()
  const clientSecret = process.env.BITRIX24_APP_CLIENT_SECRET?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

function isState(value: unknown): value is OpenLineState {
  if (!value || typeof value !== 'object') return false
  const state = value as OpenLineState
  return (
    state.version === 1 &&
    typeof state.accessToken === 'string' &&
    typeof state.refreshToken === 'string' &&
    typeof state.clientEndpoint === 'string'
  )
}

export async function loadOpenLine(payload: Payload): Promise<Stored | null> {
  const { docs } = await payload.find({
    collection: 'integrations',
    where: { key: { equals: KEY } },
    limit: 1,
    ...options,
  })
  const doc = docs[0]
  if (!doc || !isState(doc.state)) return null
  return { id: doc.id, updatedAt: doc.updatedAt, state: doc.state }
}

/**
 * Меняет состояние: mutate получает текущее (или null) и возвращает новое, null — удалить, тот же
 * объект — ничего не менять. Запись меняется условно по времени изменения: если её успел изменить
 * другой запрос (обновление токенов, событие), перечитываем и повторяем.
 */
export async function updateOpenLine(
  payload: Payload,
  mutate: (state: OpenLineState | null) => OpenLineState | null,
  attempts = 5,
): Promise<OpenLineState | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const stored = await loadOpenLine(payload)
    const next = mutate(stored ? structuredClone(stored.state) : null)
    if (stored && next === null) {
      await payload.delete({ collection: 'integrations', id: stored.id, ...options })
      return null
    }
    if (!next) return null
    if (!stored) {
      try {
        await payload.create({
          collection: 'integrations',
          data: { key: KEY, state: next },
          ...options,
        })
        return next
      } catch {
        // Запись успели создать параллельно (ключ уникален) — перечитаем.
        continue
      }
    }
    const updated = await payload.update({
      collection: 'integrations',
      where: { and: [{ id: { equals: stored.id } }, { updatedAt: { equals: stored.updatedAt } }] },
      data: { state: next },
      ...options,
    })
    if (updated.docs.length) return next
  }
  throw new Error('Не удалось сохранить состояние приложения Битрикс24: запись всё время меняется')
}

/** Запомнить ошибку для страницы «Битрикс24» (без токенов и адресов). */
export async function rememberLineError(payload: Payload, error: unknown) {
  const text = (error instanceof Error ? error.message : String(error)).slice(0, 300)
  console.error('Открытая линия:', text)
  try {
    await updateOpenLine(payload, (state) =>
      state ? { ...state, lastError: { at: new Date().toISOString(), text } } : null,
    )
  } catch {
    // Состояние не сохранилось — ошибка уже в журнале хостинга.
  }
}

/** Канал подключён к линии и приложение может писать в Битрикс24. */
export function lineReady(state: OpenLineState | null | undefined): state is OpenLineState & {
  line: { id: number; active: true; at: string }
} {
  return Boolean(appCredentials() && state?.registered && state.line?.active)
}

/**
 * Клиент REST от имени приложения по сохранённым токенам. Обновлённые токены сохраняются сразу:
 * прежний ключ обновления после этого не работает.
 */
export function openLineClient(payload: Payload, state: OpenLineState) {
  const credentials = appCredentials()
  if (!credentials)
    throw new Error('В Vercel нет BITRIX24_APP_CLIENT_ID и BITRIX24_APP_CLIENT_SECRET')
  return createAppClient({
    fetch: globalThis.fetch,
    ...credentials,
    tokens: state,
    onTokens: async (tokens) => {
      if (!tokens) return
      await updateOpenLine(payload, (current) =>
        current
          ? {
              ...current,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt,
            }
          : null,
      )
    },
  })
}

/** Состояние для страницы «Битрикс24» — без токенов. */
export type OpenLineStatus = {
  keys: boolean
  installed: boolean
  domain: string | null
  registered: boolean
  line: { id: number; active: boolean } | null
  lastSentAt: string | null
  lastEventAt: string | null
  lastError: { at: string; text: string } | null
}

export async function openLineStatus(payload: Payload): Promise<OpenLineStatus> {
  const state = (await loadOpenLine(payload))?.state
  return {
    keys: Boolean(appCredentials()),
    installed: Boolean(state),
    domain: state?.domain ?? null,
    registered: Boolean(state?.registered),
    line: state?.line ? { id: state.line.id, active: state.line.active } : null,
    lastSentAt: state?.lastSentAt ?? null,
    lastEventAt: state?.lastEventAt ?? null,
    lastError: state?.lastError ?? null,
  }
}
