import type { Payload } from 'payload'
import { conversationKey } from '@/domain/assistant.mjs'
import { refreshTokens } from '@/domain/bitrix24App.mjs'
import { deliveryParams, readOperatorMessages, sameSecret } from '@/domain/openLine.mjs'
import { updateConversation } from '../assistant/conversation'
import {
  appCredentials,
  loadOpenLine,
  type OpenLineState,
  openLineClient,
  rememberLineError,
  updateOpenLine,
} from './store'

type Auth = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Событие точно от нашего приложения на нашем портале? Сверяем токен приложения. Если его ещё нет
 * (приложение ставили из интерфейса, а не событием), подлинность подтверждает обновление токена из
 * события у сервера авторизации — тогда токен приложения запоминаем.
 */
async function trusted(payload: Payload, state: OpenLineState, auth: Auth): Promise<boolean> {
  const token = String(auth.application_token ?? '')
  if (state.applicationToken) return sameSecret(token, state.applicationToken)
  const credentials = appCredentials()
  const refresh = String(auth.refresh_token ?? '')
  if (!credentials || !token || !refresh) return false
  try {
    const tokens = await refreshTokens({ fetch: globalThis.fetch, ...credentials }, refresh)
    if (tokens.memberId !== state.memberId) return false
    await updateOpenLine(payload, (current) =>
      current ? { ...current, applicationToken: token } : null,
    )
    return true
  } catch {
    return false
  }
}

/** Имя оператора для окна чата: «Айгерим». Не узнали — пусто, сайт напишет «Менеджер CAD.kz». */
async function operatorName(payload: Payload, state: OpenLineState, userId: number) {
  const known = state.operators?.[String(userId)]
  if (known) return known
  try {
    const user = await openLineClient(payload, state).call('im.user.get', { ID: userId })
    const name = String(user?.first_name || user?.name || '')
      .trim()
      .slice(0, 40)
    if (name)
      await updateOpenLine(payload, (current) =>
        current
          ? { ...current, operators: { ...current.operators, [String(userId)]: name } }
          : null,
      )
    return name
  } catch {
    return ''
  }
}

/**
 * Менеджер написал клиенту в открытой линии: сообщение — в разговор на сайте (окно чата заберёт
 * его опросом), Кадди с этого момента молчит. Доставку подтверждаем только сохранённым сообщениям,
 * чтобы у оператора было видно, что клиент его не получил.
 */
async function operatorMessages(
  payload: Payload,
  state: OpenLineState,
  data: Record<string, unknown>,
) {
  const delivered: ReturnType<typeof readOperatorMessages> = []
  for (const message of readOperatorMessages(data)) {
    // Автоответ линии (не человек): не показываем и не считаем, что менеджер вступил.
    if (message.userId <= 0 || !message.text) {
      delivered.push(message)
      continue
    }
    const key = conversationKey(message.chatId)
    if (!key) continue
    const name = await operatorName(payload, state, message.userId)
    const ref = `op${message.imMessageId}`
    const saved = await updateConversation(payload, key, (stored) => {
      const { snapshot } = stored
      if (snapshot.messages.some((m) => m.ref === ref)) return null
      return {
        ...snapshot,
        messages: [
          ...snapshot.messages,
          {
            role: 'manager',
            content: message.text,
            at: new Date().toISOString(),
            ref,
            ...(name ? { name } : {}),
          },
        ],
        line: {
          ...snapshot.line,
          sent: snapshot.line?.sent ?? snapshot.messages.length,
          ...(message.imChatId ? { chatId: message.imChatId } : {}),
          manager: { id: message.userId, name },
        },
      }
    })
    if (saved) delivered.push(message)
  }
  const line = delivered[0]?.line || state.line?.id
  if (delivered.length && line)
    await openLineClient(payload, state).call(
      'imconnector.send.status.delivery',
      deliveryParams(line, delivered),
    )
}

/** Канал отключили от линии или удалили линию — разговоры перестают туда идти. */
function lineOff(data: Record<string, unknown>) {
  const line = Number(data.LINE ?? data.line) || 0
  return (state: OpenLineState | null) =>
    state?.line && (!line || line === state.line.id)
      ? { ...state, line: { ...state.line, active: false, at: new Date().toISOString() } }
      : state
}

/**
 * Событие Битрикс24 на адрес приложения. Возвращает HTTP-код ответа: 200 — принято,
 * 401 — не наше событие, 404 — приложение не установлено.
 */
export async function handleEvent(
  payload: Payload,
  body: Record<string, unknown>,
): Promise<number> {
  const stored = await loadOpenLine(payload)
  if (!stored) return 404
  const state = stored.state
  const auth = isRecord(body.auth) ? body.auth : {}
  if (!(await trusted(payload, state, auth))) return 401
  const event = String(body.event ?? '').toUpperCase()
  const data = isRecord(body.data) ? body.data : {}
  try {
    if (event === 'ONIMCONNECTORMESSAGEADD') await operatorMessages(payload, state, data)
    else if (event === 'ONIMCONNECTORLINEDELETE' || event === 'ONIMCONNECTORSTATUSDELETE')
      await updateOpenLine(payload, lineOff(data))
    else if (event === 'ONAPPUNINSTALL') {
      // Приложение удалили с портала: токены больше не действуют, забываем их.
      await updateOpenLine(payload, () => null)
      return 200
    }
    await updateOpenLine(payload, (current) =>
      current ? { ...current, lastEventAt: new Date().toISOString() } : null,
    )
  } catch (error) {
    await rememberLineError(payload, error)
    return 500
  }
  return 200
}
