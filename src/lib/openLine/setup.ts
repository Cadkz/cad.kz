import type { Payload } from 'payload'
import { Bitrix24AppError, refreshTokens } from '@/domain/bitrix24App.mjs'
import {
  APP_EVENTS,
  CONNECTOR_ID,
  connectorData,
  connectorRegistration,
} from '@/domain/openLine.mjs'
import { appCredentials, type OpenLineState, openLineClient, updateOpenLine } from './store'

/** Чем закончился шаг: строки для страницы приложения внутри Битрикс24. */
export type SetupResult = { ok: boolean; title: string; lines: string[] }

const NO_KEYS: SetupResult = {
  ok: false,
  title: 'Сайт не готов к подключению',
  lines: [
    'В Vercel не вписаны ключи приложения: BITRIX24_APP_CLIENT_ID (код приложения) и BITRIX24_APP_CLIENT_SECRET (ключ приложения).',
    'Впишите их, пересоберите сайт (Deployments → Redeploy) и откройте приложение ещё раз.',
  ],
}

/** Повторная подписка на то же событие — не ошибка. */
function alreadyBound(error: unknown) {
  return (
    error instanceof Bitrix24AppError &&
    /EXIST|ALREADY|BIND/i.test(String(error.code) + error.message)
  )
}

type Tokens = Awaited<ReturnType<typeof refreshTokens>>

/** Новые токены в состояние. Тот же портал — линия и кэш остаются; другой — начинаем заново. */
function withTokens(
  current: OpenLineState | null,
  tokens: Tokens,
  applicationToken: string | undefined,
): OpenLineState {
  const same = current?.memberId === tokens.memberId && current?.domain === tokens.domain
  const base = same && current ? current : null
  const appToken = applicationToken || base?.applicationToken
  return {
    ...base,
    version: 1,
    domain: tokens.domain,
    memberId: tokens.memberId,
    clientEndpoint: tokens.clientEndpoint,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    ...(appToken ? { applicationToken: appToken } : {}),
    installedAt: base?.installedAt ?? new Date().toISOString(),
    registered: base?.registered ?? false,
  }
}

/**
 * Токены из запроса Битрикс24 (установка, настройки канала) проверяем обновлением у сервера
 * авторизации: ключ приложения знает только сайт. Прошли — сохраняем как токены приложения.
 */
async function acceptTokens(
  payload: Payload,
  refreshToken: string,
  applicationToken: string | undefined,
): Promise<OpenLineState> {
  const credentials = appCredentials()
  if (!credentials) throw new Error('no-keys')
  const tokens = await refreshTokens({ fetch: globalThis.fetch, ...credentials }, refreshToken)
  const saved = await updateOpenLine(payload, (current) =>
    withTokens(current, tokens, applicationToken),
  )
  if (!saved) throw new Error('Состояние приложения не сохранилось')
  return saved
}

/** Канал в контакт-центре и подписка на события (повторный вызов безопасен). */
async function register(payload: Payload, state: OpenLineState, handlerUrl: string) {
  const client = openLineClient(payload, state)
  await client.call('imconnector.register', connectorRegistration(handlerUrl))
  for (const event of APP_EVENTS) {
    try {
      await client.call('event.bind', { event, handler: handlerUrl })
    } catch (error) {
      if (!alreadyBound(error)) throw error
    }
  }
  await updateOpenLine(payload, (current) =>
    current ? { ...current, registered: true, lastError: undefined } : null,
  )
}

function failed(error: unknown): SetupResult {
  if (error instanceof Error && error.message === 'no-keys') return NO_KEYS
  const text = error instanceof Error ? error.message : 'неизвестная ошибка'
  // Сервер авторизации не принял токен: ключи в Vercel не от этого приложения (или опечатка).
  const hint = text.startsWith('Битрикс24, oauth: invalid')
    ? 'Сверьте BITRIX24_APP_CLIENT_ID и BITRIX24_APP_CLIENT_SECRET в Vercel с кодом и ключом этого приложения, пересоберите сайт и откройте страницу ещё раз.'
    : 'Проверьте, что у приложения есть права imopenlines, imconnector и im, и откройте эту страницу ещё раз.'
  return { ok: false, title: 'Не получилось подключить', lines: [text.slice(0, 300), hint] }
}

/**
 * Установка приложения (и открытие его страницы в Битрикс24): сохранить токены, зарегистрировать
 * канал «Сайт cad.kz — Кадди», подписаться на ответы операторов.
 */
export async function installApp(
  payload: Payload,
  input: { refreshToken: string; applicationToken?: string; handlerUrl: string },
): Promise<SetupResult> {
  try {
    const state = await acceptTokens(payload, input.refreshToken, input.applicationToken)
    await register(payload, state, input.handlerUrl)
    const line = state.line?.active ? `Канал подключён к открытой линии № ${state.line.id}.` : null
    return {
      ok: true,
      title: 'Приложение «Кадди на сайте» установлено',
      lines: [
        `Портал: ${state.domain}.`,
        line ??
          'Осталось подключить канал к открытой линии: Контакт-центр → «Сайт cad.kz — Кадди» → Подключить → выбрать линию.',
      ],
    }
  } catch (error) {
    return failed(error)
  }
}

/**
 * Настройки канала в контакт-центре (выбрали линию и нажали «Подключить»): включить канал для
 * линии и передать его данные. С этого момента разговоры с Кадди идут в эту линию.
 */
export async function connectLine(
  payload: Payload,
  input: {
    refreshToken: string
    applicationToken?: string
    handlerUrl: string
    siteUrl: string
    line: number
  },
): Promise<SetupResult> {
  try {
    let state = await acceptTokens(payload, input.refreshToken, input.applicationToken)
    if (!state.registered) await register(payload, state, input.handlerUrl)
    const client = openLineClient(payload, state)
    await client.call('imconnector.activate', {
      CONNECTOR: CONNECTOR_ID,
      LINE: input.line,
      ACTIVE: 1,
    })
    await client.call('imconnector.connector.data.set', connectorData(input.line, input.siteUrl))
    const at = new Date().toISOString()
    state =
      (await updateOpenLine(payload, (current) =>
        current
          ? { ...current, line: { id: input.line, active: true, at }, lastError: undefined }
          : null,
      )) ?? state
    return {
      ok: true,
      title: 'Кадди подключён к этой открытой линии',
      lines: [
        `Линия № ${input.line}, портал ${state.domain}.`,
        'Каждый разговор с Кадди на сайте теперь появляется здесь, в открытой линии: вопрос клиента и ответ Кадди с пометкой «Кадди (ИИ)».',
        'Чтобы вмешаться, просто напишите клиенту в этом чате: сообщение появится у него в окне на сайте, а Кадди замолчит.',
        'Окно можно закрыть.',
      ],
    }
  } catch (error) {
    return failed(error)
  }
}
